import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  const { matchId, inningsBreak } = await req.json()
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 })

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { status: true } })
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })
  if (match.status === "completed") return NextResponse.json({ error: "Match is completed" }, { status: 400 })

  await prisma.match.update({
    where: { id: matchId },
    data: { inningsBreak: !!inningsBreak },
  })

  logAudit({ action: "innings_break", entity: "match", entityId: matchId, details: JSON.stringify({ inningsBreak: !!inningsBreak }), ip })

  return NextResponse.json({ ok: true, inningsBreak: !!inningsBreak })
}
