import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getClientIp } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import { cloneOfficialToPractice } from "@/lib/practice"

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { sourceSeasonId, name } = body as { sourceSeasonId?: string; name?: string }

  try {
    const result = await cloneOfficialToPractice(sourceSeasonId, name)
    logAudit({
      action: "practice_clone",
      entity: "season",
      entityId: result.practiceSeason.id,
      details: JSON.stringify({ sourceSeasonId: result.sourceSeason.id, teams: result.teamsCopied, players: result.playersCopied }),
      ip: getClientIp(req),
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Clone failed" }, { status: 400 })
  }
}
