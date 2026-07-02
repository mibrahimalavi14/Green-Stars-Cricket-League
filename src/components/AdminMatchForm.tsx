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
    status: "upcoming", youtubeUrl: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/teams").then(r => r.json()).then(setTeams)
    fetch("/api/seasons").then(r => r.json()).then(setSeasons)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) { router.push("/admin/matches"); router.refresh() }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="text-xl font-semibold">Add Match</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Season</label>
          <select required value={form.seasonId} onChange={e => setForm({...form, seasonId: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
            <option value="">Select season</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Date</label>
          <input required type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm">Team 1</label>
          <select required value={form.team1Id} onChange={e => setForm({...form, team1Id: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
            <option value="">Select team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Team 2</label>
          <select required value={form.team2Id} onChange={e => setForm({...form, team2Id: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
            <option value="">Select team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Venue</label>
          <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm">YouTube URL</label>
          <input value={form.youtubeUrl} onChange={e => setForm({...form, youtubeUrl: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm">Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50">
        {loading ? "Adding..." : "Add Match"}
      </button>
    </form>
  )
}
