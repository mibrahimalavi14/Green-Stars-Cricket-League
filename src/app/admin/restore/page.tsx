"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertTriangle, CheckCircle, Database, Trophy, Users } from "lucide-react"

interface Season { id: string; name: string; year: number }

export default function AdminDataRestorePage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch("/api/seasons").then(r => r.json()).then(d => setSeasons(d.seasons || d)).catch(() => {})
  }, [])

  async function runRestore(action: string, seasonId?: string) {
    if (action === "recalc_season" && !seasonId) return
    if (!confirm(`Run "${action}"? This may take a few seconds.`)) return

    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, seasonId }),
      })
      const data = await res.json()
      setResult({ ok: data.success, msg: data.message || data.error || "Done" })
    } catch {
      setResult({ ok: false, msg: "Network error" })
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold flex items-center gap-2">
        <Database className="w-8 h-8 text-amber-500" /> Data Restore
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Recalculate stats, rebuild snapshots, and restore data integrity</p>

      {result && (
        <div className={`mb-6 p-4 rounded-xl border ${result.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          <div className="flex items-center gap-2">
            {result.ok ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {result.msg}
          </div>
        </div>
      )}

      {/* Recalculate All */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-amber-500" /> Recalculate Everything
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Recalculates points tables, player stats, and rebuilds all snapshots for all seasons. Use if data is corrupted.
        </p>
        <button
          onClick={() => runRestore("recalc_all")}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 transition"
        >
          {loading ? "Processing..." : "Recalculate All Seasons"}
        </button>
      </div>

      {/* Per-Season Recalculate */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-blue-500" /> Recalculate Season
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Recalculate points table, player stats, and rebuild all snapshots for one season.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
          >
            <option value="">Select season...</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </select>
          <button
            onClick={() => runRestore("recalc_season", selectedSeason)}
            disabled={loading || !selectedSeason}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Recalculate
          </button>
        </div>
      </div>

      {/* Per-Match Recalculate */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 mb-6">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" /> Restore Match Stats
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Recalculate stats for a specific match. Provide the Match ID to recalculate.
        </p>
        <MatchRestoreForm loading={loading} onRestore={(matchId) => runRestore("restore_match", matchId)} />
      </div>

      {/* What it does */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-bold mb-3">What gets recalculated?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--muted-foreground)]">
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Points Table</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Wins, losses, ties, no results</li>
              <li>Points (2 for win, 1 for tie/NR)</li>
              <li>Net Run Rate (NRR)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Player Stats</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Total runs, balls, average, strike rate</li>
              <li>Total wickets, economy, bowling average</li>
              <li>Catches, stumpings, run outs</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Season Snapshots</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Points table at each match point</li>
              <li>Orange Cap / Purple Cap standings</li>
              <li>Historical records</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Records</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Highest team total, lowest defended</li>
              <li>Best bowling, best batting</li>
              <li>Most sixes, most fours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchRestoreForm({ loading, onRestore }: { loading: boolean; onRestore: (id: string) => void }) {
  const [matchId, setMatchId] = useState("")
  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={matchId}
        onChange={e => setMatchId(e.target.value)}
        placeholder="Enter match ID..."
        className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-mono text-sm"
      />
      <button
        onClick={() => onRestore(matchId)}
        disabled={loading || !matchId.trim()}
        className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition"
      >
        Restore
      </button>
    </div>
  )
}
