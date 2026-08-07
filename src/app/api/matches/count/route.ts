import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get("status") || "completed"
  const count = await prisma.match.count({ where: { status, season: { workspaceId: WORKSPACE_OFFICIAL } } })
  return NextResponse.json({ count })
}
