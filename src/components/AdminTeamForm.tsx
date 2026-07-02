"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function AdminTeamForm() {
  const router = useRouter()
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ name: "", shortName: "", color: "#1e3a5f", seasonId: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch("/api/seasons").then(r => r.json()).then(setSeasons) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setForm({ name: "", shortName: "", color: "#1e3a5f", seasonId: form.seasonId })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div>
        <label className="mb-1 block text-xs">Team Name</label>
        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm w-48" />
      </div>
      <div>
        <label className="mb-1 block text-xs">Short Name</label>
        <input required maxLength={5} value={form.shortName} onChange={e => setForm({...form, shortName: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm w-24" />
      </div>
      <div>
        <label className="mb-1 block text-xs">Color</label>
        <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
          className="h-9 w-16 rounded border border-[var(--border)]" />
      </div>
      <div>
        <label className="mb-1 block text-xs">Season</label>
        <select required value={form.seasonId} onChange={e => setForm({...form, seasonId: e.target.value})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          <option value="">Select</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading}
        className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
        Add Team
      </button>
    </form>
  )
}
