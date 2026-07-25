import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { createTeamSchema } from "@/lib/validation"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"

export async function GET() {
  const teams = await prisma.team.findMany()
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

  const team = await prisma.team.create({ data: parsed.data })
  return NextResponse.json(team)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
