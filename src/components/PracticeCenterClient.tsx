"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Copy, Trash2, ArrowUpRight, RefreshCw, BarChart3 } from "lucide-react"

interface OfficialSeason { id: string; name: string; year: number; isActive: boolean }
interface PracticeMatch { id: string; matchNo: number; status: string; date: string; venue: string; team1?: { shortName: string }; team2?: { shortName: string }; season?: { name: string } }
interface Report {
  seasons: { id: string; name: string; year: number }[]
  matches: number
  completed: number
  balls: number
  runs: number
  wickets: number
  extras: { wides: number; noBalls: number; byes: number; legByes: number; total: number }
  undoCount: number
  accuracy: number
  timeMinutes: number
}

export function PracticeCenterClient({
  initialWorkspace,
  officialSeasons,
  practiceMatches: initialMatches,
}: {
  initialWorkspace: string
  officialSeasons: OfficialSeason[]
  practiceMatches: PracticeMatch[]
}) {
  const router = useRouter()
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [matches, setMatches] = useState<PracticeMatch[]>(initialMatches)
  const [report, setReport] = useState<Report | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const activeOfficial = officialSeasons.find(s => s.isActive) || officialSeasons[0]

  const loadReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const res = await fetch("/api/admin/practice/report")
      const data = await res.json()
      if (res.ok) setReport(data)
    } finally {
      setReportLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  async function run(action: string, url: string, body?: any, opts: { reload?: boolean } = {}) {
    setBusy(action)
    setError("")
    setMessage("")
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Request failed")
        return
      }
      setMessage(action === "clone" ? `Cloned ${data.teamsCopied} teams / ${data.playersCopied} players.` : action === "reset" ? `Reset ${data.matchesDeleted} practice matches.` : "Official match created from practice.")
      if (opts.reload) router.refresh()
      loadReport()
    } catch (err: any) {
      setError(err.message || "Request failed")
    } finally {
      setBusy("")
    }
  }

  function reset() {
    if (!window.confirm("Delete ALL practice matches, stats, awards, records and snapshots? Official season data is never touched.")) return
    run("reset", "/api/admin/practice/reset", {}, { reload: true })
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">{error}</div>
      )}
      {message && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-600">{message}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><Copy className="h-4 w-4" /> Clone Official &rarr; Practice</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Copy teams, players, jersey numbers, roles and captains into a practice season. No points, records or awards are copied.
          </p>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Official season to clone</label>
            <select defaultValue={activeOfficial?.id || ""} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" id="clone-source">
              {officialSeasons.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.year}){s.isActive ? " · Active" : ""}</option>
              ))}
              {officialSeasons.length === 0 && <option value="">No official season yet</option>}
            </select>
          </div>
          <button
            onClick={() => {
              const sel = (document.getElementById("clone-source") as HTMLSelectElement)?.value
              run("clone", "/api/admin/practice/clone", { sourceSeasonId: sel })
            }}
            disabled={busy !== "" || officialSeasons.length === 0}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {busy === "clone" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Clone Now
          </button>
        </section>

        <section className="rounded-xl border border-red-500/30 bg-[var(--card)] p-6">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-red-500"><Trash2 className="h-4 w-4" /> Practice Reset</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Delete all practice matches, stats, awards, records and snapshots. Teams, players and the practice season are kept. Official data is never touched.
          </p>
          <button
            onClick={reset}
            disabled={busy !== "" || workspace !== "practice"}
            className="flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {busy === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Reset Practice Data
          </button>
          {workspace !== "practice" && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">Switch to PRACTICE MODE first (top banner).</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><BarChart3 className="h-4 w-4" /> Practice Report</h2>
        {reportLoading && !report ? (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--muted-foreground)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading report...</div>
        ) : report ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <ReportItem label="Practice matches" value={String(report.matches)} sub={`${report.completed} completed`} />
            <ReportItem label="Runs scored" value={String(report.runs)} sub={`${report.wickets} wickets down`} />
            <ReportItem label="Balls bowled" value={String(report.balls)} sub="legal deliveries" />
            <ReportItem label="Extras" value={String(report.extras.total)} sub={`${report.extras.wides} wides · ${report.extras.noBalls} no-balls · ${report.extras.byes} byes · ${report.extras.legByes} leg-byes`} />
            <ReportItem label="Undo count" value={String(report.undoCount)} sub="balls re-scored" />
            <ReportItem label="Scorer accuracy" value={`${report.accuracy}%`} sub="correct balls / total balls" />
            <ReportItem label="Time taken" value={`${report.timeMinutes} min`} sub="across completed matches" />
            <ReportItem label="Practice seasons" value={String(report.seasons.length)} sub={report.seasons.map(s => s.name).join(", ") || "none"} />
          </div>
        ) : (
          <p className="py-6 text-sm text-[var(--muted-foreground)]">No report available.</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><ArrowUpRight className="h-4 w-4" /> Promote Practice Match to Official</h2>
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Creates a setup-only official match from a completed practice match: teams, XI, captain/VC, jersey numbers, officials, venue and toss. Stats and records are NOT copied.
        </p>
        {matches.length === 0 ? (
          <p className="py-6 text-sm text-[var(--muted-foreground)]">No practice matches yet. Clone the official season and play some practice matches.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {matches.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {m.team1?.shortName || "T1"} vs {m.team2?.shortName || "T2"}
                    <span className="ml-2 rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{m.status}</span>
                  </p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {m.season?.name} · {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {m.venue}
                  </p>
                </div>
                <button
                  onClick={() => run("promote", "/api/admin/practice/promote", { practiceMatchId: m.id }, { reload: true })}
                  disabled={busy !== "" || m.status !== "completed" || workspace !== "practice"}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] disabled:opacity-40"
                  title={m.status !== "completed" ? "Only completed practice matches can be promoted" : workspace !== "practice" ? "Switch to PRACTICE MODE first" : ""}
                >
                  {busy === "promote" && m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  Create Official Match
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ReportItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  )
}
