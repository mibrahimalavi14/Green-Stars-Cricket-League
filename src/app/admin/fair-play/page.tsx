"use client"

import { useState, useEffect, useCallback } from "react"
import { ShieldCheck, Loader2, Save, History } from "lucide-react"

export default function AdminFairPlayPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [seasonId, setSeasonId] = useState("")
  const [table, setTable] = useState<any[]>([])
  const [drafts, setDrafts] = useState<Record<string, { warnings: string; behavior: string; sportsmanship: string; reason: string }>>({})
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/api/seasons").then(r => r.json()).then(s => {
      const arr = Array.isArray(s) ? s : Array.isArray(s?.seasons) ? s.seasons : []
      setSeasons(arr)
      if (arr.length > 0) {
        const active = arr.find((x: any) => x.isActive) || arr[0]
        setSeasonId(active.id)
      }
      setLoading(false)
    })
  }, [])

  const loadHistory = useCallback(async () => {
    const logs = await fetch("/api/admin/audit?action=fair_play_update&entity=team&limit=60").then(r => r.json())
    setHistory(Array.isArray(logs) ? logs : [])
  }, [])

  const load = useCallback(async (id: string) => {
    if (!id) { setTable([]); return }
    const data = await fetch(`/api/fair-play?seasonId=${id}`).then(r => r.json())
    const teams = Array.isArray(data?.teams) ? data.teams : []
    setTable(teams)
    const d: Record<string, any> = {}
    for (const t of teams) d[t.id] = { warnings: String(t.warnings), behavior: String(t.behavior), sportsmanship: String(t.sportsmanship), reason: "" }
    setDrafts(d)
  }, [])

  useEffect(() => { if (seasonId) load(seasonId) }, [seasonId, load])
  useEffect(() => { loadHistory() }, [loadHistory])

  async function save(teamId: string) {
    const d = drafts[teamId]
    if (!d) return
    setSavingId(teamId)
    setMsg("")
    const res = await fetch("/api/admin/fair-play", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonId,
        teamId,
        warnings: parseInt(d.warnings) || 0,
        behavior: parseInt(d.behavior) || 0,
        sportsmanship: parseInt(d.sportsmanship) || 0,
        reason: d.reason || "",
      }),
    })
    const data = await res.json()
    setSavingId("")
    if (!res.ok) setMsg(`Error: ${data.error || "Failed to save"}`)
    else {
      setMsg("Saved — Fair Play table updated")
      load(seasonId)
      loadHistory()
    }
  }

  const inputCls = "w-20 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-center text-sm"
  const teamNameMap = new Map(table.map(t => [t.id, t.name]))

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-green-500" />
        <div>
          <h1 className="text-3xl font-bold">Fair Play Table</h1>
          <p className="text-[var(--muted-foreground)]">
            Fair Play Points = 100 − Warnings(5) − Over-Rate(10 each, auto) − Behavior(15) − Penalty Points + Sportsmanship(×2)
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Season</label>
        <select value={seasonId} onChange={e => setSeasonId(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          <option value="">Select season...</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
        </select>
      </div>

      {msg && <p className="mb-3 text-sm text-[var(--muted-foreground)]">{msg}</p>}

      {table.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">No teams in this season</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-center">Warnings</th>
                <th className="p-3 text-center">Over-Rate</th>
                <th className="p-3 text-center">Behavior</th>
                <th className="p-3 text-center">Sportsmanship (0–10)</th>
                <th className="p-3 text-center">Penalty Pts</th>
                <th className="p-3 text-center font-bold">Fair Play Pts</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {table.map((t, i) => {
                const d = drafts[t.id]
                return (
                  <tr key={t.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-bold text-[var(--muted-foreground)]">{i + 1}</span>
                        {t.logo && <img src={t.logo} alt={t.name} className="h-7 w-7 rounded-full object-cover" />}
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <input type="number" min="0" className={inputCls} value={d?.warnings || 0} onChange={e => setDrafts(p => ({ ...p, [t.id]: { ...p[t.id], warnings: e.target.value } }))} />
                    </td>
                    <td className="p-3 text-center font-mono">{t.slowOverRate}</td>
                    <td className="p-3 text-center">
                      <input type="number" min="0" className={inputCls} value={d?.behavior || 0} onChange={e => setDrafts(p => ({ ...p, [t.id]: { ...p[t.id], behavior: e.target.value } }))} />
                    </td>
                    <td className="p-3 text-center">
                      <input type="number" min="0" max="10" className={inputCls} value={d?.sportsmanship ?? 10} onChange={e => setDrafts(p => ({ ...p, [t.id]: { ...p[t.id], sportsmanship: e.target.value } }))} />
                    </td>
                    <td className="p-3 text-center font-mono text-red-500">{t.penaltyPoints}</td>
                    <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{t.fairPlayPoints}</td>
                    <td className="p-3">
                      <input type="text" placeholder="Reason (audit log)" value={d?.reason || ""}
                        onChange={e => setDrafts(p => ({ ...p, [t.id]: { ...p[t.id], reason: e.target.value } }))}
                        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs" />
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => save(t.id)} disabled={savingId === t.id}
                        className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                        {savingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        Over-Rate and Penalty Points are derived automatically from the League Penalties module.
      </p>

      <h2 className="mt-10 mb-4 flex items-center gap-2 text-lg font-semibold">
        <History className="h-5 w-5 text-[var(--muted-foreground)]" /> Change History
      </h2>
      {history.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">No edits recorded yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-left">Who (IP)</th>
                <th className="p-3 text-left">Old Value</th>
                <th className="p-3 text-left">New Value</th>
                <th className="p-3 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                let d: any = {}
                try { d = JSON.parse(h.details || "{}") } catch { d = {} }
                const oldV = d.old ? `W:${d.old.warnings} B:${d.old.behavior} S:${d.old.sportsmanship}` : "—"
                const newV = `W:${d.new?.warnings ?? "?"} B:${d.new?.behavior ?? "?"} S:${d.new?.sportsmanship ?? "?"}`
                return (
                  <tr key={h.id || i} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="p-3 whitespace-nowrap">{new Date(h.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</td>
                    <td className="p-3 font-medium">{teamNameMap.get(h.entityId) || d.season || "—"}</td>
                    <td className="p-3 font-mono text-xs">{h.ip || "—"}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">{oldV}</td>
                    <td className="p-3">{newV}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">{d.reason || "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
