import { prisma } from "./prisma"

export type AnalyticsEventType =
  | "match_scored"
  | "match_completed"
  | "undo_used"
  | "page_view"
  | "search_query"
  | "prediction_submitted"
  | "quiz_attempted"
  | "potm_vote"
  | "player_of_season_vote"
  | "notification_sent"
  | "feature_feedback"

export async function trackEvent(
  event: AnalyticsEventType,
  metadata: Record<string, string | number> = {},
  ip: string = ""
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        metadata: JSON.stringify(metadata),
        ip,
      },
    })
  } catch {
    // silent fail — analytics should never break the app
  }
}

export async function getEventCount(
  event: AnalyticsEventType,
  since?: Date
): Promise<number> {
  const where: any = { event }
  if (since) where.createdAt = { gte: since }
  return prisma.analyticsEvent.count({ where })
}

export async function getEventsByPeriod(
  event: AnalyticsEventType,
  days: number = 30
): Promise<{ date: string; count: number }[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const events = await prisma.analyticsEvent.findMany({
    where: { event, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  const grouped: Record<string, number> = {}
  for (const e of events) {
    const d = e.createdAt.toISOString().slice(0, 10)
    grouped[d] = (grouped[d] || 0) + 1
  }
  return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

export async function getTopMetadataValues(
  event: AnalyticsEventType,
  key: string,
  limit: number = 10
): Promise<{ value: string; count: number }[]> {
  const events = await prisma.analyticsEvent.findMany({
    where: { event },
    select: { metadata: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  })
  const counts: Record<string, number> = {}
  for (const e of events) {
    try {
      const meta = JSON.parse(e.metadata)
      const val = String(meta[key] || "unknown")
      counts[val] = (counts[val] || 0) + 1
    } catch {}
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getRecentEvents(limit: number = 50) {
  return prisma.analyticsEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
