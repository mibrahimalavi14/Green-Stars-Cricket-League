"use client"

import { useState, useEffect, useCallback } from "react"
import { Crown, Trash2, Loader2, UserCheck } from "lucide-react"

export default function AdminCaptaincyPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [captaincies, setCaptaincies] = useState<any[]>([])
  const [form, setForm] = useState({ seasonId: "", teamId: "", captainId: "", viceCaptainId: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/seasons").then(r => r.json()),
      fetch("/api/teams").then(r => r.json()),
      fetch("/api/players?all=true").then(r => r.json()).catch(() => fetch("/api/players").then(r => r.json())),
    ]).then(([s, t, p]) => {
      setSeasons(Array.isArray(s) ? s : [])
      setTeams(Array.isArray(t) ? t : [])
      setPlayers(Array.isArray(p) ? p : [])
      setLoading(false)
    })
  }, [])

  const loadCaptaincies = useCallback(async () => {
    const data = await fetch("/api/captaincy").then(r => r.json())
    setCaptaincies(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { loadCaptaincies() }, [loadCaptaincies])

  const teamPlayers = players.filter(p => p.teamId === form.teamId)
  const selectedTeam = teams.find(t => t.id === form.teamId)

  async function submit() {
    if (!form.seasonId || !form.teamId || !form.captainId) return
    setSaving(true)
    await fetch("/api/captaincy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setForm({ seasonId: "", teamId: "", captainId: "", viceCaptainId: "" })
    await loadCaptaincies()
  }

  async function remove(id: string) {
    await fetch(`/api/captaincy?id=${id}`, { method: "DELETE" })
    await loadCaptaincies()
  }

  const inputCls = "w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
  const labelCls = "mb-1 block text-xs text-[var(--muted-foreground)]"

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Crown className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold">Captain &amp; Vice Captain</h1>
          <p className="text-[var(--muted-foreground)]">Record leadership for each season — history shows on team pages</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-semibold">Set Leadership</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className={labelCls}>Season</label>
            <select value={form.seasonId} onChange={e => setForm(f => ({ ...f, seasonId: e.target.value }))} className={inputCls}>
              <option value="">Select season...</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Team</label>
            <select value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value, captainId: "", viceCaptainId: "" }))} className={inputCls}>
              <option value="">Select team...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Captain</label>
            <select value={form.captainId} onChange={e => setForm(f => ({ ...f, captainId: e.target.value }))} className={inputCls} disabled={!form.teamId}>
              <option value="">Select captain...</option>
              {teamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Vice Captain</label>
            <select value={form.viceCaptainId} onChange={e => setForm(f => ({ ...f, viceCaptainId: e.target.value }))} className={inputCls} disabled={!form.teamId}>
              <option value="">None</option>
              {teamPlayers.filter(p => p.id !== form.captainId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        {selectedTeam && <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">{selectedTeam.name} — {teamPlayers.length} players available</p>}
        <button onClick={submit} disabled={saving || !form.seasonId || !form.teamId || !form.captainId}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save Leadership"}
        </button>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Leadership History</h2>
      <div className="rounded-xl border border-[var(--border)]">
        {captaincies.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">No captaincy records yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {captaincies.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: c.team?.color || "var(--muted)" }}>
                    {c.team?.logo && !c.team.logo.includes("placeholder") ? (
                      <img src={c.team.logo} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : <span className="text-xs font-bold text-white">{c.team?.shortName}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.team?.name} <span className="text-xs text-[var(--muted-foreground)]">({c.season?.name})</span></p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      <Crown className="inline h-3 w-3 text-amber-500" /> {c.captain?.name || "Unknown"}
                      {c.viceCaptain && <> &middot; <UserCheck className="inline h-3 w-3" /> {c.viceCaptain.name}</>}
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(c.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
