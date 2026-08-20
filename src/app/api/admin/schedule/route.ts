import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

async function getActiveSeason(workspaceId: string) {
  return prisma.season.findFirst({ where: { isActive: true, workspaceId } })
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = await getCurrentWorkspaceId()
  const season = await getActiveSeason(workspaceId)
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 })

  const [fixtures, teams] = await Promise.all([
    prisma.seasonFixture.findMany({ where: { seasonId: season.id }, orderBy: { matchNumber: "asc" } }),
    prisma.team.findMany({ where: { seasonId: season.id }, select: { name: true } }),
  ])

  return NextResponse.json({
    season: { id: season.id, name: season.name, scheduleAnnounced: season.scheduleAnnounced },
    formatText: season.formatText || "",
    scheduleImage: season.scheduleImage || "",
    teamNames: teams.map(t => t.name),
    fixtures: fixtures.map(f => ({
      id: f.id,
      matchNumber: f.matchNumber,
      team1Name: f.team1Name,
      team2Name: f.team2Name,
      dateTime: f.dateTime?.toISOString() || null,
      venue: f.venue || null,
      result: f.result || null,
      status: f.status,
    })),
  })
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = await getCurrentWorkspaceId()
  const season = await getActiveSeason(workspaceId)
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 })

  const body = await req.json()

  if (body.type === "format") {
    await prisma.season.update({
      where: { id: season.id },
      data: { formatText: body.formatText ?? undefined, scheduleImage: body.scheduleImage ?? undefined },
    })
    return NextResponse.json({ success: true })
  }

  if (body.type === "fixture") {
    const { matchNumber, team1Name, team2Name, dateTime, venue } = body
    if (!matchNumber || !team1Name || !team2Name) {
      return NextResponse.json({ error: "matchNumber, team1Name, team2Name required" }, { status: 400 })
    }
    const existing = await prisma.seasonFixture.findUnique({
      where: { seasonId_matchNumber: { seasonId: season.id, matchNumber: Number(matchNumber) } },
    })
    if (existing) return NextResponse.json({ error: `Match ${matchNumber} already exists` }, { status: 409 })
    const fixture = await prisma.seasonFixture.create({
      data: {
        seasonId: season.id,
        matchNumber: Number(matchNumber),
        team1Name,
        team2Name,
        dateTime: dateTime ? new Date(dateTime) : null,
        venue: venue || null,
      },
    })
    return NextResponse.json({ id: fixture.id, success: true })
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 })
}

export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, result, status, dateTime, venue } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (result !== undefined) data.result = result
  if (status !== undefined) data.status = status
  if (dateTime !== undefined) data.dateTime = dateTime ? new Date(dateTime) : null
  if (venue !== undefined) data.venue = venue

  await prisma.seasonFixture.update({ where: { id }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("fixtureId")
  if (!id) return NextResponse.json({ error: "fixtureId required" }, { status: 400 })
  await prisma.seasonFixture.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
