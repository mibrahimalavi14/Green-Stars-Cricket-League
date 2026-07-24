import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET() {
  const players = await prisma.player.findMany({ include: { team: true } })
  return NextResponse.json(players)
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const player = await prisma.player.create({ data: body })
  if (body.isCaptain) {
    await prisma.player.updateMany({ where: { teamId: player.teamId, id: { not: player.id } }, data: { isCaptain: false } })
    await prisma.team.update({ where: { id: player.teamId }, data: { captainName: player.name } })
  }
  return NextResponse.json(player)
}

const STAT_FIELDS = ["runs","ballsFaced","fours","sixes","threes","dotBalls","ones","twos","fifties","hundreds","highestScore","highestScoreNotOut","notOuts","ducks","matchesPlayed","wickets","ballsBowled","runsConceded","maidens","wides","noBalls","fiveWickets","fourWickets","hattricks","bestBowlingWickets","bestBowlingRuns","bestBowlingBalls","catches","stumpings","runOuts","timesBowled","timesCaught","timesLbw","timesStumped","timesRunOut"]

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, ...data } = body

  if (data.resetStats) {
    const reset = Object.fromEntries(STAT_FIELDS.map(f => [f, 0]))
    const player = await prisma.player.update({ where: { id }, data: reset })
    return NextResponse.json(player)
  }

  if (data.resetTeamStats) {
    const reset = Object.fromEntries(STAT_FIELDS.map(f => [f, 0]))
    await prisma.player.updateMany({ where: { teamId: data.teamId }, data: reset })
    return NextResponse.json({ success: true })
  }

  const player = await prisma.player.update({ where: { id }, data })
  if (data.isCaptain) {
    await prisma.player.updateMany({ where: { teamId: player.teamId, id: { not: player.id } }, data: { isCaptain: false } })
    await prisma.team.update({ where: { id: player.teamId }, data: { captainName: player.name } })
  } else if (data.isCaptain === false) {
    const me = await prisma.player.findUnique({ where: { id }, select: { teamId: true, name: true } })
    if (me) {
      const team = await prisma.team.findUnique({ where: { id: me.teamId }, select: { captainName: true } })
      if (team?.captainName === player.name) {
        await prisma.team.update({ where: { id: me.teamId }, data: { captainName: "" } })
      }
    }
  }
  return NextResponse.json(player)
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  const player = await prisma.player.findUnique({ where: { id }, select: { teamId: true, name: true, isCaptain: true } })
  if (player?.isCaptain) {
    await prisma.team.update({ where: { id: player.teamId }, data: { captainName: "" } })
  }
  await prisma.player.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
