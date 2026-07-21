import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const players = await prisma.player.findMany({ include: { team: true } })
  return NextResponse.json(players)
}

export async function POST(req: Request) {
  const body = await req.json()
  const player = await prisma.player.create({ data: body })
  if (body.isCaptain) {
    await prisma.player.updateMany({ where: { teamId: player.teamId, id: { not: player.id } }, data: { isCaptain: false } })
    await prisma.team.update({ where: { id: player.teamId }, data: { captainName: player.name } })
  }
  return NextResponse.json(player)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...data } = body
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
