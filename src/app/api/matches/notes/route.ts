import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const matchId = searchParams.get("matchId")
    if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 })

    const notes = await prisma.matchNotes.findUnique({ where: { matchId } })
    return NextResponse.json(notes || null)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await isAdminAuthenticated()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { matchId, weather, temperature, pitchType, groundCondition, delayReason, delayDuration, refereeNotes, injuryNotes, replacements, fines, incidents } = body

    if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 })

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    const notes = await prisma.matchNotes.upsert({
      where: { matchId },
      update: { weather, temperature, pitchType, groundCondition, delayReason, delayDuration, refereeNotes, injuryNotes, replacements, fines, incidents },
      create: { matchId, weather, temperature, pitchType, groundCondition, delayReason, delayDuration, refereeNotes, injuryNotes, replacements, fines, incidents },
    })

    logAudit({ action: "update_match_notes", entity: "match", entityId: matchId, details: JSON.stringify({ weather, pitchType }), ip })

    return NextResponse.json(notes)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
