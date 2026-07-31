import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"
import { abandonMatchSchema } from "@/lib/validation"
import { saveSeasonSnapshot } from "@/lib/snapshots"

const REASON_LABELS: Record<string, string> = {
  rain: "Rain",
  bad_light: "Bad Light",
  ground_issue: "Ground Issue",
  walkover: "Walkover",
  technical_issue: "Technical Issue",
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = abandonMatchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { matchId, reason, description } = parsed.data
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { season: true, team1: true, team2: true },
    })
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
    if (match.status === "completed") {
      return NextResponse.json({ error: "Match already completed" }, { status: 400 })
    }

    const result = `No Result — ${REASON_LABELS[reason] || reason}`
    const winnerTeamId: string | null = reason === "walkover" ? null : null

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "completed",
        result,
        winnerTeamId,
        abandonReason: reason,
        abandonDescription: description || "",
        inningsBreak: false,
        matchEndTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      },
    })

    const { recalcPointsTable } = await import("@/lib/stats")
    await recalcPointsTable(match.seasonId)
    await saveSeasonSnapshot(match.seasonId, matchId)

    logAudit({ action: "abandon_match", entity: "match", entityId: matchId, details: JSON.stringify({ reason, description, result }), ip })

    return NextResponse.json({ success: true, match: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
