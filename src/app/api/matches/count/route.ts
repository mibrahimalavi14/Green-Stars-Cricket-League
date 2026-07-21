import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get("status") || "completed"
  const count = await prisma.match.count({ where: { status } })
  return NextResponse.json({ count })
}
