"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function AdminPlayerForm() {
  const router = useRouter()
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ name: "", role: "Batsman", teamId: "", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast", isCaptain: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch("/api/teams").then(r => r.json()).then(setTeams) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div>
        <label className="mb-1 block text-xs">Player Name</label>
        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm w-48" />
      </div>
      <div>
        <label className="mb-1 block text-xs">Role</label>
        <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          <option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>Wicket-keeper</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs">Batting Style</label>
        <select value={form.battingStyle} onChange={e => setForm({...form, battingStyle: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          <option>Right-handed</option><option>Left-handed</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs">Bowling Style</label>
        <select value={form.bowlingStyle} onChange={e => setForm({...form, bowlingStyle: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          <option>Right-arm fast</option><option>Right-arm fast-medium</option><option>Right-arm medium</option>
          <option>Left-arm fast</option><option>Left-arm fast-medium</option><option>Left-arm medium</option>
          <option>Right-arm off break</option><option>Left-arm orthodox</option><option>Leg break googly</option>
          <option>Slow left-arm chinaman</option><option>Right-arm leg break</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs">Team</label>
        <select required value={form.teamId} onChange={e => setForm({...form, teamId: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          <option value="">Select</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="flex items-end pb-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isCaptain} onChange={e => setForm({...form, isCaptain: e.target.checked})}
            className="h-4 w-4" />
          <span className="text-xs font-medium">Captain</span>
        </label>
      </div>
      <button type="submit" disabled={loading}
        className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
        Add Player
      </button>
    </form>
  )
}
