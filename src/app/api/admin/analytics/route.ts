import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import {
  getEventCount,
  getEventsByPeriod,
  getTopMetadataValues,
  getRecentEvents,
} from "@/lib/analytics"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const since30d = new Date()
  since30d.setDate(since30d.getDate() - 30)
  const since7d = new Date()
  since7d.setDate(since7d.getDate() - 7)

  const [
    totalMatchScored,
    totalMatchCompleted,
    totalUndoUsed,
    totalPageViews,
    totalSearches,
    matchScored30d,
    matchCompleted30d,
    undoUsed30d,
    pageViews30d,
    searches30d,
    matchByDay,
    undoByDay,
    pageViewsByDay,
    searchesByDay,
    topSearchTerms,
    topPages,
    recentEvents,
  ] = await Promise.all([
    getEventCount("match_scored"),
    getEventCount("match_completed"),
    getEventCount("undo_used"),
    getEventCount("page_view"),
    getEventCount("search_query"),
    getEventCount("match_scored", since30d),
    getEventCount("match_completed", since30d),
    getEventCount("undo_used", since30d),
    getEventCount("page_view", since30d),
    getEventCount("search_query", since30d),
    getEventsByPeriod("match_completed", 30),
    getEventsByPeriod("undo_used", 30),
    getEventsByPeriod("page_view", 30),
    getEventsByPeriod("search_query", 30),
    getTopMetadataValues("search_query", "query", 10),
    getTopMetadataValues("page_view", "path", 10),
    getRecentEvents(50),
  ])

  return NextResponse.json({
    totals: {
      matchScored: totalMatchScored,
      matchCompleted: totalMatchCompleted,
      undoUsed: totalUndoUsed,
      pageViews: totalPageViews,
      searches: totalSearches,
    },
    last30d: {
      matchScored: matchScored30d,
      matchCompleted: matchCompleted30d,
      undoUsed: undoUsed30d,
      pageViews: pageViews30d,
      searches: searches30d,
    },
    trends: {
      matchByDay,
      undoByDay,
      pageViewsByDay,
      searchesByDay,
    },
    topSearchTerms,
    topPages,
    recentEvents,
  })
}
