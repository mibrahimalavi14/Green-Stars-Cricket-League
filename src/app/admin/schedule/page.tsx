"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, Save, Calendar, Image } from "lucide-react"

interface Fixture {
  id: string
  matchNumber: number
  team1Name: string
  team2Name: string
  dateTime: string | null
  venue: string | null
  result: string | null
  status: string
}

export default function AdminSchedulePage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [seasonName, setSeasonName] = useState("")
  const [formatText, setFormatText] = useState("")
  const [scheduleImage, setScheduleImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingFormat, setSavingFormat] = useState(false)
  const [adding, setAdding] = useState(false)

  const [newMatch, setNewMatch] = useState({ matchNumber: 1, team1: "", team2: "", date: "", time: "", venue: "" })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const res = await fetch("/api/admin/schedule")
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setFixtures(data.fixtures || [])
    setTeamNames(data.teamNames || [])
    setSeasonName(data.season?.name || "")
    setFormatText(data.formatText || "")
    setScheduleImage(data.scheduleImage || "")
    if (data.fixtures?.length) setNewMatch(n => ({ ...n, matchNumber: data.fixtures.length + 1 }))
    setLoading(false)
  }

  async function saveFormat() {
    setSavingFormat(true)
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "format", formatText, scheduleImage }),
    })
    setSavingFormat(false)
  }

  async function addFixture() {
    if (!newMatch.team1 || !newMatch.team2) return
    setAdding(true)
    const dateTime = newMatch.date && newMatch.time ? `${newMatch.date}T${newMatch.time}` : undefined
    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "fixture",
        matchNumber: Number(newMatch.matchNumber),
        team1Name: newMatch.team1,
        team2Name: newMatch.team2,
        dateTime,
        venue: newMatch.venue || undefined,
      }),
    })
    if (res.ok) {
      setNewMatch(n => ({ ...n, matchNumber: n.matchNumber + 1, team1: "", team2: "", date: "", time: "", venue: "" }))
      fetchData()
    }
    setAdding(false)
  }

  async function deleteFixture(id: string) {
    if (!confirm("Delete this fixture?")) return
    await fetch(`/api/admin/schedule?fixtureId=${id}`, { method: "DELETE" })
    fetchData()
  }

  async function updateFixtureStatus(id: string, status: string) {
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    fetchData()
  }

  async function updateFixtureResult(id: string, result: string) {
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, result }),
    })
    fetchData()
  }

  if (loading) return <div className="p-8 text-center text-[var(--muted-foreground)]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Schedule & Format</h1>
      <p className="text-[var(--muted-foreground)]">{seasonName}</p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Image className="h-5 w-5 text-[var(--accent)]" /> Schedule Image & Format</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Schedule Image URL</label>
            <input
              type="url"
              placeholder="https://... (poster/schedule image)"
              value={scheduleImage}
              onChange={e => setScheduleImage(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tournament Format / Rules</label>
            <textarea
              rows={4}
              placeholder={"e.g.\n• 4 overs per innings\n• 5 players per team\n• Knockout format"}
              value={formatText}
              onChange={e => setFormatText(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={saveFormat}
            disabled={savingFormat}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {savingFormat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus className="h-5 w-5 text-[var(--accent)]" /> Add Fixture</h2>
        <div className="flex flex-wrap gap-3">
          <div className="w-20">
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">#</label>
            <input type="number" min={1} value={newMatch.matchNumber} onChange={e => setNewMatch(n => ({ ...n, matchNumber: +e.target.value }))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Team 1</label>
            <select value={newMatch.team1} onChange={e => setNewMatch(n => ({ ...n, team1: e.target.value }))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
              <option value="">Select</option>
              {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Team 2</label>
            <select value={newMatch.team2} onChange={e => setNewMatch(n => ({ ...n, team2: e.target.value }))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
              <option value="">Select</option>
              {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Date</label>
            <input type="date" value={newMatch.date} onChange={e => setNewMatch(n => ({ ...n, date: e.target.value }))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Time</label>
            <input type="time" value={newMatch.time} onChange={e => setNewMatch(n => ({ ...n, time: e.target.value }))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Venue</label>
            <input type="text" placeholder="Optional" value={newMatch.venue} onChange={e => setNewMatch(n => ({ ...n, venue: e.target.value }))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={addFixture} disabled={adding || !newMatch.team1 || !newMatch.team2} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Calendar className="h-5 w-5 text-[var(--accent)]" /> Fixtures ({fixtures.length})</h2>
        {fixtures.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No fixtures yet</p>
        ) : (
          <div className="space-y-3">
            {fixtures.map(f => (
              <div key={f.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm">
                <span className="w-8 font-bold text-[var(--accent)]">M{f.matchNumber}</span>
                <span className="flex-1 font-medium">{f.team1Name} vs {f.team2Name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {f.dateTime ? new Date(f.dateTime).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD"}
                  {f.venue ? ` · ${f.venue}` : ""}
                </span>
                <select
                  value={f.status}
                  onChange={e => updateFixtureStatus(f.id, e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
                <input
                  type="text"
                  placeholder="Result"
                  defaultValue={f.result || ""}
                  onBlur={e => updateFixtureResult(f.id, e.target.value)}
                  className="w-32 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
                />
                <button onClick={() => deleteFixture(f.id)} className="h-8 w-8 inline-flex items-center justify-center rounded text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
