"use client"

import { useState, useEffect, useCallback } from "react"
import { ShieldAlert, Trash2, Loader2 } from "lucide-react"

const TYPES: { value: string; label: string }[] = [
  { value: "over_rate", label: "Over-Rate Penalty" },
  { value: "fine", label: "Fine" },
  { value: "points_deduction", label: "Points Deduction" },
  { value: "forfeit", label: "Match Forfeited" },
]

const TYPE_LABELS: Record<string, string> = {
  over_rate: "Over-Rate",
  fine: "Fine",
  points_deduction: "Points Deduction",
  forfeit: "Forfeit",
}

export default function AdminPenaltiesPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [penalties, setPenalties] = useState<any[]>([])
  const [seasonFilter, setSeasonFilter] = useState("")
  const [form, setForm] = useState({ seasonId: "", teamId: "", matchId: "", type: "fine", points: 0, description: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/seasons").then(r => r.json()),
      fetch("/api/teams").then(r => r.json()),
      fetch("/api/matches").then(r => r.json()),
    ]).then(([s, t, m]) => {
      setSeasons(Array.isArray(s) ? s : [])
      setTeams(Array.isArray(t) ? t : [])
      setMatches(Array.isArray(m) ? m : [])
      setLoading(false)
    })
  }, [])

  const loadPenalties = useCallback(async (seasonId?: string) => {
    const qs = seasonId ? `?seasonId=${seasonId}` : ""
    const data = await fetch(`/api/penalties${qs}`).then(r => r.json())
    setPenalties(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { loadPenalties() }, [loadPenalties])

  function teamMatches(teamId: string) {
    return matches.filter(m => m.team1Id === teamId || m.team2Id === teamId)
  }

  async function submit() {
    if (!form.seasonId || !form.teamId) return
    setSaving(true)
    await fetch("/api/penalties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setForm(f => ({ ...f, matchId: "", type: "fine", points: 0, description: "" }))
    await loadPenalties(seasonFilter || undefined)
  }

  async function remove(id: string) {
    await fetch(`/api/penalties?id=${id}`, { method: "DELETE" })
    await loadPenalties(seasonFilter || undefined)
  }

  const inputCls = "w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
  const labelCls = "mb-1 block text-xs text-[var(--muted-foreground)]"

  const totals: Record<string, number> = {}
  for (const p of penalties) totals[p.teamId] = (totals[p.teamId] || 0) + p.points

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold">League Penalties</h1>
          <p className="text-[var(--muted-foreground)]">Points deductions reflect automatically on the points table</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-semibold">Add Penalty</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Season</label>
            <select value={form.seasonId} onChange={e => setForm(f => ({ ...f, seasonId: e.target.value, teamId: "", matchId: "" }))} className={inputCls}>
              <option value="">Select season...</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Team</label>
            <select value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value, matchId: "" }))} className={inputCls}>
              <option value="">Select team...</option>
              {teams.filter(t => t.seasonId === form.seasonId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Points (deducted)</label>
            <input type="number" min="0" value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Match (optional)</label>
            <select value={form.matchId} onChange={e => setForm(f => ({ ...f, matchId: e.target.value }))} className={inputCls} disabled={!form.teamId}>
              <option value="">—</option>
              {teamMatches(form.teamId).map(m => (
                <option key={m.id} value={m.id}>M{m.matchNo || "-"}: {m.team1?.shortName} vs {m.team2?.shortName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Slow over rate" className={inputCls} />
          </div>
        </div>
        <button onClick={submit} disabled={saving || !form.seasonId || !form.teamId}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Add Penalty"}
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Penalty Log</h2>
        <select value={seasonFilter} onChange={e => { setSeasonFilter(e.target.value); loadPenalties(e.target.value || undefined) }} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm">
          <option value="">All seasons</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)]">
        {penalties.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">No penalties recorded yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {penalties.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-bold text-red-500">-{p.points} pts</span>
                  <div>
                    <p className="text-sm font-medium">{p.team?.name} <span className="text-xs text-[var(--muted-foreground)]">({TYPE_LABELS[p.type] || p.type})</span></p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {p.season?.name}
                      {p.description ? ` · ${p.description}` : ""}
                      {p.match ? ` · M${p.match.matchNo}: ${p.match.team1?.shortName} vs ${p.match.team2?.shortName}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(totals).length > 0 && (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 font-semibold">Total Deductions</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totals).map(([teamId, pts]) => {
              const team = teams.find(t => t.id === teamId)
              return <span key={teamId} className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500">{team?.shortName || "?"} -{pts}</span>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
