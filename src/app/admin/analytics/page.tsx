"use client"

import { useState, useEffect } from "react"
import { Loader2, BarChart3, TrendingUp, Search, Eye, RotateCcw, Trophy, Gamepad2, Vote } from "lucide-react"

interface AnalyticsData {
  totals: {
    matchScored: number
    matchCompleted: number
    undoUsed: number
    pageViews: number
    searches: number
    predictions: number
    quizAttempts: number
    potmVotes: number
  }
  last30d: {
    matchScored: number
    matchCompleted: number
    undoUsed: number
    pageViews: number
    searches: number
  }
  trends: {
    matchByDay: { date: string; count: number }[]
    undoByDay: { date: string; count: number }[]
    pageViewsByDay: { date: string; count: number }[]
    searchesByDay: { date: string; count: number }[]
  }
  topSearchTerms: { value: string; count: number }[]
  topPages: { value: string; count: number }[]
  recentEvents: { id: string; event: string; metadata: string; ip: string; createdAt: string }[]
}

const EVENT_ICONS: Record<string, string> = {
  match_scored: "🏏",
  match_completed: "🏆",
  undo_used: "↩️",
  page_view: "👁️",
  search_query: "🔍",
  prediction_submitted: "🔮",
  quiz_attempted: "❓",
  potm_vote: "⭐",
  notification_sent: "🔔",
  feature_feedback: "💬",
}

const EVENT_LABELS: Record<string, string> = {
  match_scored: "Match Scored",
  match_completed: "Match Completed",
  undo_used: "Undo Used",
  page_view: "Page View",
  search_query: "Search Query",
  prediction_submitted: "Prediction",
  quiz_attempted: "Quiz Attempt",
  potm_vote: "POTM Vote",
  notification_sent: "Notification",
  feature_feedback: "Feedback",
}

function MiniBarChart({ data, maxColor }: { data: { date: string; count: number }[]; maxColor?: string }) {
  if (data.length === 0) return <p className="text-xs text-[var(--muted-foreground)]">No data yet</p>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-px" style={{ height: "48px" }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{
            height: `${Math.max(2, (d.count / max) * 44)}px`,
            backgroundColor: maxColor || "var(--accent)",
            opacity: 0.6 + (d.count / max) * 0.4,
          }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Failed to load analytics</p>
      </div>
    )
  }

  const t = data.totals
  const m = data.last30d

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Matches Scored", value: t.matchScored, icon: "🏏", sub: `${m.matchScored} this month` },
          { label: "Matches Completed", value: t.matchCompleted, icon: "🏆", sub: `${m.matchCompleted} this month` },
          { label: "Undo Used", value: t.undoUsed, icon: "↩️", sub: `${m.undoUsed} this month` },
          { label: "Page Views", value: t.pageViews, icon: "👁️", sub: `${m.pageViews} this month` },
          { label: "Searches", value: t.searches, icon: "🔍", sub: `${m.searches} this month` },
          { label: "Predictions", value: t.predictions, icon: "🔮", sub: "All time" },
          { label: "Quiz Attempts", value: t.quizAttempts, icon: "❓", sub: "All time" },
          { label: "POTM Votes", value: t.potmVotes, icon: "⭐", sub: "All time" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.icon}</span>
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
                <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-1 text-[10px] text-green-600">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <TrendingUp className="h-3.5 w-3.5" /> Matches (30 days)
          </h3>
          <MiniBarChart data={data.trends.matchByDay} maxColor="#22c55e" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <Eye className="h-3.5 w-3.5" /> Page Views (30 days)
          </h3>
          <MiniBarChart data={data.trends.pageViewsByDay} maxColor="#3b82f6" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <RotateCcw className="h-3.5 w-3.5" /> Undo Usage (30 days)
          </h3>
          <MiniBarChart data={data.trends.undoByDay} maxColor="#f59e0b" />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <Search className="h-3.5 w-3.5" /> Searches (30 days)
          </h3>
          <MiniBarChart data={data.trends.searchesByDay} maxColor="#a855f7" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Top Search Terms</h3>
          {data.topSearchTerms.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No searches yet</p>
          ) : (
            <div className="space-y-1.5">
              {data.topSearchTerms.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium">{s.value}</span>
                  <span className="ml-2 shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Most Visited Pages</h3>
          {data.topPages.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No views yet</p>
          ) : (
            <div className="space-y-1.5">
              {data.topPages.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium">{s.value}</span>
                  <span className="ml-2 shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Recent Events</h3>
        {data.recentEvents.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">No events yet</p>
        ) : (
          <div className="space-y-1">
            {data.recentEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-lg bg-[var(--muted)] px-2.5 py-1.5 text-xs">
                <span>{EVENT_ICONS[e.event] || "📌"}</span>
                <span className="font-medium">{EVENT_LABELS[e.event] || e.event}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--muted-foreground)]">
                  {(() => { try { return Object.entries(JSON.parse(e.metadata)).map(([k, v]) => `${k}: ${v}`).join(", ") } catch { return "" } })()}
                </span>
                <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
