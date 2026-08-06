import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { logAudit } from "@/lib/audit"

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await prisma.workspace.findUnique({
    where: { id: "official" },
    select: { titlesLeaderboardVisible: true },
  })

  return NextResponse.json({ titlesLeaderboardVisible: workspace?.titlesLeaderboardVisible ?? true })
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const visible = body?.titlesLeaderboardVisible
  if (typeof visible !== "boolean") {
    return NextResponse.json({ error: "titlesLeaderboardVisible (boolean) is required" }, { status: 400 })
  }

  const workspace = await prisma.workspace.upsert({
    where: { id: "official" },
    create: { id: "official", name: "Official Season", type: "OFFICIAL", titlesLeaderboardVisible: visible },
    update: { titlesLeaderboardVisible: visible },
    select: { titlesLeaderboardVisible: true },
  })

  logAudit({
    action: visible ? "titles_leaderboard_shown" : "titles_leaderboard_hidden",
    entity: "workspace",
    entityId: "official",
    details: JSON.stringify({ titlesLeaderboardVisible: visible }),
  })

  return NextResponse.json({ success: true, titlesLeaderboardVisible: workspace.titlesLeaderboardVisible })
}
