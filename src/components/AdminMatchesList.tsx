"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Match {
  id: string; matchNo: number; stage: string; date: string; status: string; result: string; team1Score: string; team2Score: string
  tossWinner: string; tossDecision: string; manOfMatch: string; venue: string
  umpire1: string; umpire2: string; thirdUmpire: string; matchReferee: string; officialScorer: string
  tossTime: string; matchStartTime: string; matchEndTime: string; delayReason: string
  attendance: number; dls: boolean
  team1: { id: string; shortName: string; name: string; color: string; logo: string }
  team2: { id: string; shortName: string; name: string; color: string; logo: string }
  season: { name: string }
}

const ABANDON_REASONS = [
  { value: "rain", label: "Rain" },
  { value: "bad_light", label: "Bad Light" },
  { value: "ground_issue", label: "Ground Issue" },
  { value: "walkover", label: "Walkover" },
  { value: "technical_issue", label: "Technical Issue" },
]

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Match>>({})
  const [saving, setSaving] = useState(false)
  const [abandoningId, setAbandoningId] = useState<string | null>(null)
  const [abandonReason, setAbandonReason] = useState("rain")
  const [abandonDesc, setAbandonDesc] = useState("")
  const [abandoning, setAbandoning] = useState(false)

  async function updateStatus(id: string, status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    router.refresh()
  }

  async function deleteMatch(id: string) {
    setDeleting(id)
    await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    router.refresh()
  }

  async function abandonMatch(id: string) {
    setAbandoning(true)
    await fetch("/api/matches/abandon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: id, reason: abandonReason, description: abandonDesc }),
    })
    setAbandoning(false)
    setAbandoningId(null)
    setAbandonDesc("")
    router.refresh()
  }

  function openEdit(match: Match) {
    setEditingId(match.id)
    setEditForm({
      umpire1: match.umpire1 || "", umpire2: match.umpire2 || "",
      thirdUmpire: match.thirdUmpire || "", matchReferee: match.matchReferee || "",
      officialScorer: match.officialScorer || "", tossTime: match.tossTime || "",
      matchStartTime: match.matchStartTime || "", matchEndTime: match.matchEndTime || "",
      delayReason: match.delayReason || "", tossWinner: match.tossWinner || "",
      tossDecision: match.tossDecision || "", attendance: match.attendance || 0, dls: match.dls || false,
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    })
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  const inputCls = "w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
  const labelCls = "text-[10px] text-[var(--muted-foreground)] mb-0.5 block"

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const stageLabel: Record<string, string> = {
          league: "", qualifier1: "Qualifier 1", eliminator: "Eliminator", qualifier2: "Qualifier 2", final: "Final",
        }
        const isPlayoff = m.stage !== "league"
        const hasOfficials = m.umpire1 || m.umpire2 || m.thirdUmpire || m.matchReferee || m.officialScorer
        return (
        <div key={m.id} className={`rounded-lg border p-3 sm:p-4 ${isPlayoff ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10' : 'border-[var(--border)] bg-[var(--card)]'}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">{isPlayoff ? `${stageLabel[m.stage] || m.stage}` : `${m.season.name} · Match ${m.matchNo}`} · {new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })} · {new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</p>
              {isPlayoff ? (
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{stageLabel[m.stage] || m.stage}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">·</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">TBD</p>
                  <span className="text-xs text-amber-600 dark:text-amber-400">vs</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">TBD</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {m.team1.logo && <img src={m.team1.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />}
                  <p className="font-medium text-sm">{m.team1.name}</p>
                  <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                  <p className="font-medium text-sm">{m.team2.name}</p>
                  {m.team2.logo && <img src={m.team2.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />}
                </div>
              )}
              {!isPlayoff && m.team1Score && <p className="text-sm">{m.team1Score} - {m.team2Score}</p>}
              {!isPlayoff && m.result && <p className="text-xs text-[var(--muted-foreground)]">{m.result}</p>}
              {m.dls && <span className="mt-0.5 inline-block rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-500">DLS</span>}
              {m.attendance > 0 && <span className="mt-0.5 ml-1 inline-block text-[10px] text-[var(--muted-foreground)]">{m.attendance} spectators</span>}
              {hasOfficials && editingId !== m.id && (
                <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                  {m.umpire1 && `UM1: ${m.umpire1}`}
                  {m.umpire1 && m.umpire2 && " · "}
                  {m.umpire2 && `UM2: ${m.umpire2}`}
                  {m.matchReferee && ` · Ref: ${m.matchReferee}`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
              <span className={`rounded px-2 py-1 text-xs font-medium ${
                m.status === "live" ? "bg-red-500/20 text-red-500" :
                m.status === "completed" ? "bg-green-500/20 text-green-500" :
                "bg-blue-500/20 text-blue-500"
              }`}>{m.status}</span>
              {m.status === "upcoming" && (
                <button onClick={() => updateStatus(m.id, "live")} className="rounded bg-red-500 px-2 py-1 text-xs text-white whitespace-nowrap">Set Live</button>
              )}
              {m.status === "live" && (
                <Link href={`/admin/live-scoring/${m.id}`} className="rounded bg-purple-600 px-2 py-1 text-xs text-white whitespace-nowrap hover:bg-purple-700">
                  Live Scoring
                </Link>
              )}
              {(m.status === "completed" || m.status === "live") && (
                <Link href="/admin/performances" className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white whitespace-nowrap hover:opacity-90">
                  Scorecard
                </Link>
              )}
              {m.status !== "completed" && (
                <button onClick={() => { setAbandoningId(m.id); setAbandonReason("rain"); setAbandonDesc("") }}
                  className="rounded bg-orange-600 px-2 py-1 text-xs text-white whitespace-nowrap hover:bg-orange-700">
                  Abandon
                </button>
              )}
              <button onClick={() => editingId === m.id ? setEditingId(null) : openEdit(m)}
                className="rounded bg-[var(--muted)] px-2 py-1 text-xs text-[var(--muted-foreground)] whitespace-nowrap hover:bg-[var(--muted-foreground)]/20">
                {editingId === m.id ? "Close" : "Officials"}
              </button>
              <button onClick={() => deleteMatch(m.id)} disabled={deleting === m.id}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50 whitespace-nowrap">Delete</button>
            </div>
          </div>

          {editingId === m.id && (
            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Toss Winner</label>
                  <select value={editForm.tossWinner || ""} onChange={e => setEditForm({...editForm, tossWinner: e.target.value})} className={inputCls}>
                    <option value="">—</option>
                    <option value={m.team1.id}>{m.team1.name}</option>
                    <option value={m.team2.id}>{m.team2.name}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Toss Decision</label>
                  <select value={editForm.tossDecision || ""} onChange={e => setEditForm({...editForm, tossDecision: e.target.value})} className={inputCls}>
                    <option value="">—</option>
                    <option value="bat">Bat</option>
                    <option value="bowl">Bowl</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Toss Time</label>
                  <input type="time" value={editForm.tossTime || ""} onChange={e => setEditForm({...editForm, tossTime: e.target.value})} className={inputCls} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                <div>
                  <label className={labelCls}>Umpire 1</label>
                  <input value={editForm.umpire1 || ""} onChange={e => setEditForm({...editForm, umpire1: e.target.value})} placeholder="Name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Umpire 2</label>
                  <input value={editForm.umpire2 || ""} onChange={e => setEditForm({...editForm, umpire2: e.target.value})} placeholder="Name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Third Umpire</label>
                  <input value={editForm.thirdUmpire || ""} onChange={e => setEditForm({...editForm, thirdUmpire: e.target.value})} placeholder="Optional" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Referee</label>
                  <input value={editForm.matchReferee || ""} onChange={e => setEditForm({...editForm, matchReferee: e.target.value})} placeholder="Name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Scorer</label>
                  <input value={editForm.officialScorer || ""} onChange={e => setEditForm({...editForm, officialScorer: e.target.value})} placeholder="Name" className={inputCls} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Match Start</label>
                  <input type="time" value={editForm.matchStartTime || ""} onChange={e => setEditForm({...editForm, matchStartTime: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Match End</label>
                  <input type="time" value={editForm.matchEndTime || ""} onChange={e => setEditForm({...editForm, matchEndTime: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Delay Reason</label>
                  <input value={editForm.delayReason || ""} onChange={e => setEditForm({...editForm, delayReason: e.target.value})} placeholder="Rain, Bad light..." className={inputCls} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Attendance (spectators)</label>
                  <input type="number" min="0" value={editForm.attendance || 0}
                    onChange={e => setEditForm({...editForm, attendance: Number(e.target.value)})} className={inputCls} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!editForm.dls}
                      onChange={e => setEditForm({...editForm, dls: e.target.checked})} className="h-4 w-4" />
                    <span>Match decided by DLS</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => saveEdit(m.id)} disabled={saving}
                  className="rounded bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving..." : "Save Officials"}
                </button>
              </div>
            </div>
          )}
        </div>
      )})}
      {matches.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No matches yet.</p>}

      {abandoningId && (() => {
        const m = matches.find(x => x.id === abandoningId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !abandoning && setAbandoningId(null)}>
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="mb-1 text-lg font-bold">Abandon Match</h3>
              {m && <p className="mb-4 text-sm text-[var(--muted-foreground)]">{m.team1.shortName} vs {m.team2.shortName} — result will be No Result (1 point each)</p>}
              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Reason</label>
              <select value={abandonReason} onChange={e => setAbandonReason(e.target.value)} className="mb-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                {ABANDON_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Details (optional)</label>
              <textarea value={abandonDesc} onChange={e => setAbandonDesc(e.target.value)} rows={2} placeholder="e.g. Heavy rain after 2.3 overs"
                className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setAbandoningId(null)} disabled={abandoning} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">Cancel</button>
                <button onClick={() => abandonMatch(abandoningId)} disabled={abandoning}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {abandoning ? "Abandoning..." : "Confirm Abandon"}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
