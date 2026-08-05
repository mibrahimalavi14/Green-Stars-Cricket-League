import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { squadMemberSchema } from "@/lib/validation"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("matchId")
  const workspaceId = await getCurrentWorkspaceId()

  const where: any = { player: { team: { season: { workspaceId } } } }
  if (matchId) where.matchId = matchId
  const members = await prisma.squadMember.findMany({
    where,
    include: { player: { select: { name: true, role: true, photo: true, jerseyNumber: true, status: true } } },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`squad:${ip}`, RATE_LIMITS.SQUAD)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const body = await req.json()
  const parsed = squadMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { matchId, playerId, teamId, role } = parsed.data

  const workspaceId = await getCurrentWorkspaceId()
  const match = await prisma.match.findFirst({ where: { id: matchId, season: { workspaceId } }, select: { isSquadLocked: true, status: true, seasonId: true } })
  if (match && match.isSquadLocked) {
    return NextResponse.json({ error: "Squad is locked. Match is already live." }, { status: 403 })
  }
  if (match && match.status !== "upcoming") {
    return NextResponse.json({ error: "Can only edit squad for upcoming matches." }, { status: 403 })
  }

  const { assertSeasonUnlocked } = await import("@/lib/season-guard")
  const lockErr = await assertSeasonUnlocked(match?.seasonId)
  if (lockErr) return NextResponse.json({ error: lockErr }, { status: 423 })

  const existing = await prisma.squadMember.findUnique({ where: { matchId_playerId: { matchId, playerId } } })
  if (existing) {
    const m = await prisma.squadMember.update({ where: { id: existing.id }, data: { role: role || "playing" } })
    return NextResponse.json(m)
  }

  const m = await prisma.squadMember.create({ data: { matchId, playerId, teamId: teamId || "", role: role || "playing" } })
  return NextResponse.json(m)
}

export async function DELETE(req: Request) {
  const ip = getClientIp(req)
  const rl = rateLimit(`squad_del:${ip}`, RATE_LIMITS.SQUAD)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const member = await prisma.squadMember.findUnique({ where: { id }, select: { matchId: true } })
  if (member) {
    const workspaceId = await getCurrentWorkspaceId()
    const match = await prisma.match.findFirst({ where: { id: member.matchId, season: { workspaceId } }, select: { isSquadLocked: true, status: true } })
    if (match && match.isSquadLocked) {
      return NextResponse.json({ error: "Squad is locked. Match is already live." }, { status: 403 })
    }
    if (match && match.status !== "upcoming") {
      return NextResponse.json({ error: "Can only edit squad for upcoming matches." }, { status: 403 })
    }
  }

  await prisma.squadMember.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
