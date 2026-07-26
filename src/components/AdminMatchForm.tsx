"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Team { id: string; name: string; shortName: string; color: string }
interface Season { id: string; name: string; year: number }

export function AdminMatchForm() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [form, setForm] = useState({
    seasonId: "", team1Id: "", team2Id: "", date: "", venue: "Main Stadium",
    status: "upcoming", youtubeUrl: "", matchNo: "", stage: "league",
    tossWinner: "", tossDecision: "", tossTime: "", matchStartTime: "",
    umpire1: "", umpire2: "", thirdUmpire: "", matchReferee: "", officialScorer: "",
    delayReason: "",
  })
  const [loading, setLoading] = useState(false)
  const [showOfficials, setShowOfficials] = useState(false)

  useEffect(() => {
    fetch("/api/teams").then(r => r.json()).then(setTeams)
    fetch("/api/seasons").then(r => r.json()).then(setSeasons)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload: Record<string, unknown> = {
      seasonId: form.seasonId, team1Id: form.team1Id, team2Id: form.team2Id,
      date: form.date, venue: form.venue, status: form.status,
      youtubeUrl: form.youtubeUrl, stage: form.stage,
      tossWinner: form.tossWinner, tossDecision: form.tossDecision,
      tossTime: form.tossTime, matchStartTime: form.matchStartTime,
      umpire1: form.umpire1, umpire2: form.umpire2,
      thirdUmpire: form.thirdUmpire, matchReferee: form.matchReferee,
      officialScorer: form.officialScorer, delayReason: form.delayReason,
    }
    if (form.matchNo) payload.matchNo = parseInt(form.matchNo)
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) { router.push("/admin/matches"); router.refresh() }
    setLoading(false)
  }

  const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
  const labelCls = "mb-1 block text-sm font-medium"

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-xl font-semibold">Add Match</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Season *</label>
          <select required value={form.seasonId} onChange={e => setForm({...form, seasonId: e.target.value})} className={inputCls}>
            <option value="">Select season</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date *</label>
          <input required type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Team 1 *</label>
          <select required value={form.team1Id} onChange={e => setForm({...form, team1Id: e.target.value})} className={inputCls}>
            <option value="">Select team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Team 2 *</label>
          <select required value={form.team2Id} onChange={e => setForm({...form, team2Id: e.target.value})} className={inputCls}>
            <option value="">Select team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Match Number</label>
          <input type="number" min="0" value={form.matchNo} onChange={e => setForm({...form, matchNo: e.target.value})}
            placeholder="Auto-assigned if empty" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Stage</label>
          <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})} className={inputCls}>
            <option value="league">League</option>
            <option value="qualifier1">Qualifier 1</option>
            <option value="eliminator">Eliminator</option>
            <option value="qualifier2">Qualifier 2</option>
            <option value="final">Final</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Venue</label>
          <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls}>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
        <h3 className="mb-3 text-sm font-semibold">Toss</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelCls}>Toss Winner</label>
            <select value={form.tossWinner} onChange={e => setForm({...form, tossWinner: e.target.value})} className={inputCls}>
              <option value="">Not decided</option>
              {form.team1Id && <option value={form.team1Id}>{teams.find(t => t.id === form.team1Id)?.name || "Team 1"}</option>}
              {form.team2Id && <option value={form.team2Id}>{teams.find(t => t.id === form.team2Id)?.name || "Team 2"}</option>}
            </select>
          </div>
          <div>
            <label className={labelCls}>Toss Decision</label>
            <select value={form.tossDecision} onChange={e => setForm({...form, tossDecision: e.target.value})} className={inputCls}>
              <option value="">Not decided</option>
              <option value="bat">Bat</option>
              <option value="bowl">Bowl</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Toss Time</label>
            <input type="time" value={form.tossTime} onChange={e => setForm({...form, tossTime: e.target.value})} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Match Officials & Timing</h3>
          <button type="button" onClick={() => setShowOfficials(!showOfficials)}
            className="text-xs text-[var(--accent)] hover:underline">
            {showOfficials ? "Hide" : "Show"}
          </button>
        </div>
        {showOfficials && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Match Start Time</label>
                <input type="time" value={form.matchStartTime} onChange={e => setForm({...form, matchStartTime: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Delay / Interrupt Reason</label>
                <input value={form.delayReason} onChange={e => setForm({...form, delayReason: e.target.value})}
                  placeholder="e.g. Rain, Bad light" className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelCls}>Umpire 1</label>
                <input value={form.umpire1} onChange={e => setForm({...form, umpire1: e.target.value})} placeholder="Name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Umpire 2</label>
                <input value={form.umpire2} onChange={e => setForm({...form, umpire2: e.target.value})} placeholder="Name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Third Umpire</label>
                <input value={form.thirdUmpire} onChange={e => setForm({...form, thirdUmpire: e.target.value})} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Match Referee</label>
                <input value={form.matchReferee} onChange={e => setForm({...form, matchReferee: e.target.value})} placeholder="Name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Official Scorer</label>
                <input value={form.officialScorer} onChange={e => setForm({...form, officialScorer: e.target.value})} placeholder="Name" className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>YouTube URL</label>
          <input value={form.youtubeUrl} onChange={e => setForm({...form, youtubeUrl: e.target.value})} className={inputCls} />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50">
        {loading ? "Adding..." : "Add Match"}
      </button>
    </form>
  )
}
