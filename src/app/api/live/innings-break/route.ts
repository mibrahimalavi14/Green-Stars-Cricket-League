import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const { matchId, inningsBreak } = await req.json()
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 })

  await prisma.match.update({
    where: { id: matchId },
    data: { inningsBreak: !!inningsBreak },
  })

  return NextResponse.json({ ok: true, inningsBreak: !!inningsBreak })
}
