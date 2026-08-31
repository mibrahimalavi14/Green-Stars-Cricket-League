import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getEventCount, getEventsByPeriod } from "@/lib/analytics"
import { MATCH_CONFIG } from "@/lib/config"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let database = "disconnected"
  try {
    await prisma.$queryRaw`SELECT 1`
    database = "connected"
  } catch {
    database = "error"
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const since30d = new Date()
  since30d.setDate(since30d.getDate() - 30)

  const [
    teams,
    players,
    matches,
    innings,
    playerMatches,
    news,
    notifications,
    unreadNotifications,
    galleryImages,
    moments,
    auditLogs,
    analyticsEvents,
    snapshots,
    superOvers,
    totalEventCounts,
    matchCompleted30d,
    matchScored30d,
    pageViews30d,
    errors,
    activeSeason,
    activeMatches,
    lastSnapshot,
    lastRestore,
    recentAudit,
  ] = await Promise.all([
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.inning.count(),
    prisma.playerMatch.count(),
    prisma.news.count(),
    prisma.notification.count(),
    prisma.notification.count({ where: { read: false } }),
    prisma.galleryImage.count(),
    prisma.momentOfTheDay.count(),
    prisma.auditLog.count(),
    prisma.analyticsEvent.count(),
    prisma.seasonSnapshot.count(),
    prisma.superOverInnings.count(),
    prisma.analyticsEvent.groupBy({ by: ["event"], _count: { _all: true } }),
    getEventCount("match_completed", since30d),
    getEventCount("match_scored", since30d),
    getEventCount("page_view", since30d),
    prisma.auditLog.findMany({
      where: { action: { contains: "error", mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { action: true, entity: true, entityId: true, details: true, createdAt: true },
    }),
    prisma.season.findFirst({ where: { isActive: true } }),
    prisma.match.findMany({
      where: { status: { notIn: ["completed", "abandoned", "cancelled"] } },
      include: { team1: { select: { name: true, shortName: true } }, team2: { select: { name: true, shortName: true } } },
      orderBy: { date: "asc" },
      take: 10,
    }),
    prisma.seasonSnapshot.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({
      where: { action: { in: ["restore_match", "recalc_season", "recalc_all", "backup"] } },
      orderBy: { createdAt: "desc" },
      select: { action: true, createdAt: true },
    }),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { action: true, entity: true, createdAt: true } }),
  ])

  const counts = {
    teams,
    players,
    matches,
    innings,
    playerMatches,
    news,
    notifications,
    galleryImages,
    moments,
    auditLogs,
    analyticsEvents,
    snapshots,
    superOvers,
  }

  const eventTotals: Record<string, number> = {}
  for (const g of totalEventCounts) eventTotals[g.event] = g._count._all

  let seasonInfo = null
  if (activeSeason) {
    const [seasonTeams, seasonPlayers, seasonMatches, seasonCompleted] = await Promise.all([
      prisma.team.count({ where: { seasonId: activeSeason.id } }),
      prisma.player.count({ where: { team: { seasonId: activeSeason.id } } }),
      prisma.match.count({ where: { seasonId: activeSeason.id } }),
      prisma.match.count({ where: { seasonId: activeSeason.id, status: "completed" } }),
    ])
    seasonInfo = {
      id: activeSeason.id,
      name: activeSeason.name,
      year: activeSeason.year,
      teams: seasonTeams,
      players: seasonPlayers,
      matches: seasonMatches,
      completedMatches: seasonCompleted,
    }
  }

  return NextResponse.json({
    ok: database === "connected",
    generatedAt: new Date().toISOString(),
    health: {
      api: "ok",
      database,
      status: database === "connected" ? "ok" : "degraded",
      version: "v1.3.2",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      deployment: process.env.VERCEL_ENV || "local",
      region: process.env.VERCEL_REGION || null,
      config: {
        oversPerInnings: MATCH_CONFIG.oversPerInnings,
        totalBalls: MATCH_CONFIG.totalBalls,
        wicketsPerInnings: MATCH_CONFIG.wicketsPerInnings,
      },
    },
    counts,
    activeSeason: seasonInfo,
    activeMatches: activeMatches.map((m) => ({
      id: m.id,
      matchNo: m.matchNo,
      team1: m.team1?.shortName || m.team1?.name || "TBD",
      team2: m.team2?.shortName || m.team2?.name || "TBD",
      status: m.status,
      date: m.date.toISOString(),
    })),
    queue: {
      unreadNotifications,
      scheduledMatches: activeMatches.filter((m) => m.status === "scheduled").length,
      liveMatches: activeMatches.filter((m) => m.status === "live" || m.status === "super_over").length,
    },
    backup: {
      lastSnapshotAt: lastSnapshot?.createdAt.toISOString() || null,
      snapshotCount: snapshots,
    },
    restore: lastRestore
      ? { lastRestoreAt: lastRestore.createdAt.toISOString(), action: lastRestore.action }
      : { lastRestoreAt: null, action: null },
    errors: {
      count: errors.length,
      recent: errors.slice(0, 5).map((e) => ({ action: e.action, createdAt: e.createdAt.toISOString() })),
    },
    analytics: {
      totals: {
        matchScored: eventTotals["match_scored"] || 0,
        matchCompleted: eventTotals["match_completed"] || 0,
        undoUsed: eventTotals["undo_used"] || 0,
        pageViews: eventTotals["page_view"] || 0,
        searches: eventTotals["search_query"] || 0,
        apiRequests: Object.values(eventTotals).reduce((a, b) => a + b, 0),
      },
      last30d: {
        matchScored: matchScored30d,
        matchCompleted: matchCompleted30d,
        pageViews: pageViews30d,
      },
    },
    recentAudit: recentAudit
      ? { action: recentAudit.action, entity: recentAudit.entity, at: recentAudit.createdAt.toISOString() }
      : null,
  })
}
