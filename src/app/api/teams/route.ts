import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createTeamSchema } from "@/lib/validation"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { getCurrentWorkspaceId } from "@/lib/workspace"

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId()
  const teams = await prisma.team.findMany({ where: { season: { workspaceId } } })
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`team_write:${ip}`, RATE_LIMITS.GENERAL_WRITE)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const body = await req.json()
  const parsed = createTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { id: parsed.data.seasonId, workspaceId }, select: { id: true } })
  if (!season) return NextResponse.json({ error: "Season not found in this workspace" }, { status: 404 })

  const team = await prisma.team.create({ data: parsed.data })
  return NextResponse.json(team)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  const workspaceId = await getCurrentWorkspaceId()
  const existing = await prisma.team.findFirst({ where: { id, season: { workspaceId } }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Team not found in this workspace" }, { status: 404 })
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
