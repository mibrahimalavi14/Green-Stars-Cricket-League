import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId } })
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 })

  return NextResponse.json({
    season: { id: season.id, name: season.name, scheduleAnnounced: season.scheduleAnnounced },
    scheduleImage: season.scheduleImage || "",
    formatImage: season.formatImage || "",
  })
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId } })
  if (!season) return NextResponse.json({ error: "No active season" }, { status: 404 })

  const body = await req.json()

  await prisma.season.update({
    where: { id: season.id },
    data: {
      scheduleImage: body.scheduleImage ?? undefined,
      formatImage: body.formatImage ?? undefined,
    },
  })

  return NextResponse.json({ success: true })
}
