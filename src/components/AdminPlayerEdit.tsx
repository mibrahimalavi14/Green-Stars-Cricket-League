"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Player {
  id: string
  name: string
  role: string
  battingStyle: string
  bowlingStyle: string
  teamId: string
  team: { id: string; name: string; shortName: string }
  runs: number
  wickets: number
}

interface Team { id: string; name: string }

export function AdminPlayerEdit({ player, teams }: { player: Player; teams: Team[] }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: player.name, role: player.role, battingStyle: player.battingStyle, bowlingStyle: player.bowlingStyle, teamId: player.teamId, isCaptain: (player as any).isCaptain })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setLoading(true)
    await fetch("/api/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: player.id, ...form }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="text-xs text-[var(--accent)] hover:underline">
        Edit
      </button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs w-32" />
      <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs">
        <option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>Wicket-keeper</option>
      </select>
      <select value={form.battingStyle} onChange={e => setForm({...form, battingStyle: e.target.value})}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs">
        <option>Right-handed</option><option>Left-handed</option>
      </select>
      <select value={form.bowlingStyle} onChange={e => setForm({...form, bowlingStyle: e.target.value})}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs">
        <option>Right-arm fast</option><option>Right-arm fast-medium</option><option>Right-arm medium</option>
        <option>Left-arm fast</option><option>Left-arm fast-medium</option><option>Left-arm medium</option>
        <option>Right-arm off break</option><option>Left-arm orthodox</option><option>Leg break googly</option>
        <option>Slow left-arm chinaman</option><option>Right-arm leg break</option>
      </select>
      <select value={form.teamId} onChange={e => setForm({...form, teamId: e.target.value})}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs">
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <label className="flex items-center gap-1 text-xs cursor-pointer">
        <input type="checkbox" checked={form.isCaptain} onChange={e => setForm({...form, isCaptain: e.target.checked})} className="h-3 w-3" />
        Captain
      </label>
      <button onClick={handleSave} disabled={loading}
        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50">
        {loading ? "..." : "Save"}
      </button>
      <button onClick={() => setEditing(false)}
        className="text-xs text-[var(--muted-foreground)] hover:underline">
        Cancel
      </button>
    </div>
  )
}
