"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  Activity,
  Database,
  ShieldAlert,
  Clock,
  RotateCcw,
  Boxes,
  Layers,
  BarChart3,
  Calendar,
  GitCommit,
  HardDrive,
  RefreshCw,
} from "lucide-react"

interface SystemData {
  ok: boolean
  generatedAt: string
  health: {
    api: string
    database: string
    status: string
    version: string
    commit: string
    deployment: string
    region: string | null
    config: { oversPerInnings: number; totalBalls: number; wicketsPerInnings: number }
  }
  counts: Record<string, number>
  activeSeason: { id: string; name: string; year: number; teams: number; players: number; matches: number; completedMatches: number } | null
  activeMatches: { id: string; matchNo: number; team1: string; team2: string; status: string; date: string }[]
  queue: { unreadNotifications: number; scheduledMatches: number; liveMatches: number }
  backup: { lastSnapshotAt: string | null; snapshotCount: number }
  restore: { lastRestoreAt: string | null; action: string | null }
  errors: { count: number; recent: { action: string; createdAt: string }[] }
  analytics: {
    totals: Record<string, number>
    last30d: { matchScored: number; matchCompleted: number; pageViews: number }
  }
  recentAudit: { action: string; entity: string; at: string } | null
}

const STATUS_DOT: Record<string, string> = {
  ok: "#22c55e",
  degraded: "#f59e0b",
  error: "#ef4444",
  connected: "#22c55e",
  disconnected: "#f59e0b",
  live: "#22c55e",
  super_over: "#a855f7",
  scheduled: "#3b82f6",
  squad_locked: "#f59e0b",
}

function fmtDate(iso: string | null) {
  if (!iso) return "Never"
  const d = new Date(iso)
  const s = d.toLocaleString()
  return isNaN(d.getTime()) ? "Never" : s
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never"
  const ms = Date.now() - new Date(iso).getTime()
  if (isNaN(ms) || ms < 0) return "Never"
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ${hrs % 24}h ago`
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    let mounted = true
    const load = () => {
      fetch("/api/admin/system")
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() })
        .then((d) => {
          if (!mounted) return
          setData(d)
          setLoading(false)
          setLastRefresh(new Date())
        })
        .catch(() => mounted && setLoading(false))
    }
    load()
    const t = setInterval(load, 60000)
    return () => {
      mounted = false
      clearInterval(t)
    }
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
        <p className="text-[var(--muted-foreground)]">Failed to load system status</p>
      </div>
    )
  }

  const h = data.health
  const healthy = h.status === "ok" && data.ok
  const card = "rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">System Monitor</h1>
          <span
            className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: healthy ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
              color: healthy ? "#22c55e" : "#f59e0b",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_DOT[h.status] || "#f59e0b", boxShadow: `0 0 6px ${STATUS_DOT[h.status] || "#f59e0b"}` }}
            />
            {h.status.toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            fetch("/api/admin/system")
              .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() })
              .then((d) => { setData(d); setLastRefresh(new Date()) })
              .finally(() => setLoading(false))
          }}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent)]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <p className="mb-6 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
        <Clock className="h-3 w-3" /> Auto-refreshes every 60s · updated {timeAgo(lastRefresh.toISOString())}
      </p>

      {/* Health banner */}
      <div className={`mb-6 rounded-xl border p-4 ${healthy ? "border-green-500/40 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" style={{ color: h.database === "connected" ? "#22c55e" : "#f59e0b" }} />
            <div>
              <p className="text-sm font-semibold">Database: {h.database}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {h.config.oversPerInnings}-over innings · {h.config.totalBalls} balls · {h.config.wicketsPerInnings} wickets
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <GitCommit className="h-3 w-3" /> {h.commit} · {h.deployment}
              {h.region ? ` · ${h.region}` : ""}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">v{h.version}</p>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "API Requests", value: data.analytics.totals.apiRequests.toLocaleString(), sub: `${data.analytics.last30d.pageViews.toLocaleString()} page views / 30d`, icon: <BarChart3 className="h-4 w-4" /> },
          { label: "Error Count", value: String(data.errors.count), sub: data.errors.recent[0] ? timeAgo(data.errors.recent[0].createdAt) : "No errors recorded", icon: <ShieldAlert className="h-4 w-4" />, warn: data.errors.count > 0 },
          { label: "Last Backup", value: timeAgo(data.backup.lastSnapshotAt), sub: `${data.backup.snapshotCount} snapshots stored`, icon: <HardDrive className="h-4 w-4" /> },
          { label: "Last Restore", value: timeAgo(data.restore.lastRestoreAt), sub: data.restore.action || "No restores yet", icon: <RotateCcw className="h-4 w-4" /> },
        ].map((s) => (
          <div key={s.label} className={card}>
            <div className="mb-2 flex items-center gap-1.5 text-xs" style={{ color: s.warn ? "#ef4444" : "var(--muted-foreground)" }}>
              {s.icon}
              <span>{s.label}</span>
            </div>
            <p className={`text-base font-bold leading-tight ${s.warn ? "text-red-500" : ""}`}>{s.value}</p>
            <p className="mt-0.5 truncate text-[10px] text-[var(--muted-foreground)]">{s.sub}</p>
          </div>
        ))}

        <div className={card}>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Calendar className="h-4 w-4" />
            <span>Active Season</span>
          </div>
          {data.activeSeason ? (
            <>
              <p className="text-base font-bold leading-tight">{data.activeSeason.name}</p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                {data.activeSeason.teams} teams · {data.activeSeason.players} players · {data.activeSeason.completedMatches}/{data.activeSeason.matches} matches done
              </p>
            </>
          ) : (
            <p className="text-base font-bold leading-tight text-amber-500">None</p>
          )}
        </div>

        <div className={card}>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Activity className="h-4 w-4" />
            <span>Active Match</span>
          </div>
          {data.activeMatches.length === 0 ? (
            <p className="text-base font-bold leading-tight">None</p>
          ) : (
            <>
              <p className="truncate text-base font-bold leading-tight">
                {data.activeMatches[0].team1} v {data.activeMatches[0].team2}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                {data.queue.liveMatches} live · {data.queue.scheduledMatches} scheduled
              </p>
            </>
          )}
        </div>

        <div className={card}>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Layers className="h-4 w-4" />
            <span>Queue</span>
          </div>
          <p className="text-base font-bold leading-tight">{data.queue.unreadNotifications} unread</p>
          <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">notifications pending</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Storage / row counts */}
        <div className={card}>
          <h3 className="mb-3 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <Boxes className="h-3.5 w-3.5" /> Storage (DB row counts)
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(data.counts)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-[var(--muted-foreground)]">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="font-semibold">{v.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Analytics summary */}
        <div className={card}>
          <h3 className="mb-3 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics Summary
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ["Matches Scored", "matchScored"],
              ["Matches Completed", "matchCompleted"],
              ["Undo Used", "undoUsed"],
              ["Page Views", "pageViews"],
              ["Searches", "searches"],
            ].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">{label}</span>
                <span className="font-semibold">{((data.analytics.totals[key] || 0) as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-[var(--border)] pt-2 text-[10px] text-[var(--muted-foreground)]">
            30d: {data.analytics.last30d.matchScored} scored · {data.analytics.last30d.matchCompleted} completed · {data.analytics.last30d.pageViews} page views
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Active / upcoming matches */}
        <div className={card}>
          <h3 className="mb-3 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <Calendar className="h-3.5 w-3.5" /> Active & Upcoming Matches
          </h3>
          {data.activeMatches.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No active or upcoming matches</p>
          ) : (
            <div className="space-y-1.5">
              {data.activeMatches.map((m) => (
                <div key={m.id} className="flex items-center gap-2 rounded-lg bg-[var(--muted)] px-2.5 py-1.5 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_DOT[m.status] || "#94a3b8" }} />
                  <span className="font-semibold">M{m.matchNo}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {m.team1} v {m.team2}
                  </span>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{m.status.replace(/_/g, " ")}</span>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{new Date(m.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Errors + recent activity */}
        <div className={card}>
          <h3 className="mb-3 flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
            <ShieldAlert className="h-3.5 w-3.5" /> Recent Errors & Activity
          </h3>
          {data.errors.count === 0 ? (
            <p className="mb-3 rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs text-green-600">No system errors recorded</p>
          ) : (
            <div className="mb-3 space-y-1.5">
              {data.errors.recent.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs">
                  <span className="truncate font-medium text-red-600">{e.action}</span>
                  <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{timeAgo(e.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Last action: {data.recentAudit ? `${data.recentAudit.action} (${data.recentAudit.entity}) · ${timeAgo(data.recentAudit.at)}` : "None"}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">Generated {fmtDate(data.generatedAt)}</p>
        </div>
      </div>
    </div>
  )
}
