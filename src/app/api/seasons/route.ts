import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createSeasonSchema } from "@/lib/validation"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { logAudit } from "@/lib/audit"
import { getCurrentWorkspaceId, WORKSPACE_OFFICIAL } from "@/lib/workspace"

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId()
  const seasons = await prisma.season.findMany({ where: { workspaceId }, orderBy: { year: "desc" } })
  return NextResponse.json(seasons)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`season_write:${ip}`, RATE_LIMITS.GENERAL_WRITE)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const body = await req.json()
  const parsed = createSeasonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.create({ data: { ...parsed.data, workspaceId } })
  logAudit({ action: "season_created", entity: "season", entityId: season.id, details: JSON.stringify({ name: season.name, year: season.year, workspaceId }), ip })
  return NextResponse.json(season)
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ip = getClientIp(req)
  const rl = rateLimit(`season_write:${ip}`, RATE_LIMITS.GENERAL_WRITE)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 })

  const body = await req.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const workspaceId = await getCurrentWorkspaceId()
  const existing = await prisma.season.findFirst({ where: { id, workspaceId }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Season not found in this workspace" }, { status: 404 })

  const season = await prisma.season.update({ where: { id }, data })
  logAudit({ action: "season_updated", entity: "season", entityId: id, details: JSON.stringify({ ...Object.keys(data), workspaceId }), ip })
  return NextResponse.json(season)
}
