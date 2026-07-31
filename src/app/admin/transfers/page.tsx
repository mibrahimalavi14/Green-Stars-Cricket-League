"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeftRight, Trash2, Loader2 } from "lucide-react"

export default function AdminTransfersPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [seasonFilter, setSeasonFilter] = useState("")
  const [form, setForm] = useState({ playerId: "", seasonId: "", fromTeamId: "", toTeamId: "", transferDate: "", reason: "" })
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

  const loadTransfers = useCallback(async (seasonId?: string) => {
    const qs = seasonId ? `?seasonId=${seasonId}` : ""
    const data = await fetch(`/api/transfers${qs}`).then(r => r.json())
    setTransfers(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { loadTransfers() }, [loadTransfers])

  function playerTeam(playerId: string): string {
    const p = players.find(x => x.id === playerId)
    return p?.teamId || ""
  }

  function handlePlayerChange(playerId: string) {
    setForm(f => ({ ...f, playerId, fromTeamId: playerTeam(playerId) }))
  }

  async function submit() {
    if (!form.playerId || !form.seasonId || !form.toTeamId) return
    setSaving(true)
    await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setForm({ playerId: "", seasonId: "", fromTeamId: "", toTeamId: "", transferDate: "", reason: "" })
    await loadTransfers(seasonFilter || undefined)
  }

  async function remove(id: string) {
    await fetch(`/api/transfers?id=${id}`, { method: "DELETE" })
    await loadTransfers(seasonFilter || undefined)
  }

  const inputCls = "w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
  const labelCls = "mb-1 block text-xs text-[var(--muted-foreground)]"

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <ArrowLeftRight className="h-6 w-6 text-[var(--accent)]" />
        <div>
          <h1 className="text-3xl font-bold">Player Transfers</h1>
          <p className="text-[var(--muted-foreground)]">Track player movement across seasons for history &amp; reports</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 font-semibold">New Transfer</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Player</label>
            <select value={form.playerId} onChange={e => handlePlayerChange(e.target.value)} className={inputCls}>
              <option value="">Select player...</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team?.shortName || p.role})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Season</label>
            <select value={form.seasonId} onChange={e => setForm(f => ({ ...f, seasonId: e.target.value }))} className={inputCls}>
              <option value="">Select season...</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Transfer Date</label>
            <input type="date" value={form.transferDate} onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>From Team (auto from current team)</label>
            <select value={form.fromTeamId} onChange={e => setForm(f => ({ ...f, fromTeamId: e.target.value }))} className={inputCls}>
              <option value="">—</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>To Team</label>
            <select value={form.toTeamId} onChange={e => setForm(f => ({ ...f, toTeamId: e.target.value }))} className={inputCls}>
              <option value="">Select team...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Traded, Released, New signing..." className={inputCls} />
          </div>
        </div>
        <button onClick={submit} disabled={saving || !form.playerId || !form.seasonId || !form.toTeamId}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Record Transfer"}
        </button>
        <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">Recording a transfer automatically moves the player to the new team.</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transfer History</h2>
        <select value={seasonFilter} onChange={e => { setSeasonFilter(e.target.value); loadTransfers(e.target.value || undefined) }} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm">
          <option value="">All seasons</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)]">
        {transfers.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">No transfers recorded yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {transfers.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-bold">{t.player?.name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium">{t.player?.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t.fromTeam ? <>{t.fromTeam.name} <ArrowLeftRight className="inline h-3 w-3" /> </> : null}
                      {t.toTeam?.name} &middot; {t.season?.name} &middot; {new Date(t.transferDate).toLocaleDateString("en-GB")}
                    </p>
                    {t.reason && <p className="text-[11px] text-[var(--muted-foreground)]">{t.reason}</p>}
                  </div>
                </div>
                <button onClick={() => remove(t.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
