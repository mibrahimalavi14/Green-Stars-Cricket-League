"use client"

import { useState, useEffect, useCallback } from "react"
import { Award, Trash2, Loader2 } from "lucide-react"

const CATEGORIES = [
  { value: "orange_cap", label: "Orange Cap", icon: "🧢" },
  { value: "purple_cap", label: "Purple Cap", icon: "🟣" },
  { value: "mvp", label: "MVP", icon: "🏅" },
  { value: "best_batter", label: "Best Batter", icon: "🏏" },
  { value: "best_bowler", label: "Best Bowler", icon: "🎳" },
  { value: "emerging_player", label: "Emerging Player", icon: "⭐" },
  { value: "fair_play", label: "Fair Play", icon: "🤝" },
]

export default function AdminAwardsPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [awards, setAwards] = useState<any[]>([])
  const [form, setForm] = useState({ seasonId: "", category: "orange_cap", playerId: "", teamId: "", note: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/seasons").then(r => r.json()),
      fetch("/api/players?all=true").then(r => r.json()).catch(() => fetch("/api/players").then(r => r.json())),
      fetch("/api/teams").then(r => r.json()),
    ]).then(([s, p, t]) => {
      setSeasons(Array.isArray(s) ? s : [])
      setPlayers(Array.isArray(p) ? p : [])
      setTeams(Array.isArray(t) ? t : [])
      setLoading(false)
    })
  }, [])

  const loadAwards = useCallback(async () => {
    const data = await fetch("/api/awards").then(r => r.json())
    setAwards(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { loadAwards() }, [loadAwards])

  async function submit() {
    if (!form.seasonId || !form.category) return
    setSaving(true)
    await fetch("/api/awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setForm(f => ({ ...f, playerId: "", teamId: "", note: "" }))
    await loadAwards()
  }

  async function remove(id: string) {
    await fetch(`/api/awards?id=${id}`, { method: "DELETE" })
    await loadAwards()
  }

  const inputCls = "w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
  const labelCls = "mb-1 block text-xs text-[var(--muted-foreground)]"
  const selectedCategory = CATEGORIES.find(c => c.value === form.category)

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Award className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold">Season Awards</h1>
          <p className="text-[var(--muted-foreground)]">Orange Cap, Purple Cap, MVP and more — one award per season per category</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-semibold">Assign Award</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Season</label>
            <select value={form.seasonId} onChange={e => setForm(f => ({ ...f, seasonId: e.target.value }))} className={inputCls}>
              <option value="">Select season...</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Player (optional for Fair Play)</label>
            <select value={form.playerId} onChange={e => setForm(f => ({ ...f, playerId: e.target.value }))} className={inputCls}>
              <option value="">—</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team?.shortName || p.role})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Team (optional)</label>
            <select value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))} className={inputCls}>
              <option value="">—</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Note (optional)</label>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. 210 runs, 3 fifties" className={inputCls} />
          </div>
        </div>
        <button onClick={submit} disabled={saving || !form.seasonId}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : `${selectedCategory?.icon} Assign ${selectedCategory?.label}`}
        </button>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Award History</h2>
      <div className="rounded-xl border border-[var(--border)]">
        {awards.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">No awards assigned yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {awards.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORIES.find(c => c.value === a.category)?.icon || "🏅"}</span>
                  <div>
                    <p className="text-sm font-medium">{a.categoryLabel} <span className="text-xs text-[var(--muted-foreground)]">({a.season?.name})</span></p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {a.player?.name || a.team?.name || "—"}
                      {a.player && a.team?.name ? ` (${a.team.name})` : ""}
                      {a.note ? ` · ${a.note}` : ""}
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(a.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
