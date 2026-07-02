"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AdminSeasonForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", year: new Date().getFullYear() })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/seasons", {
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
        <label className="mb-1 block text-xs">Season Name</label>
        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Season 1"
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm w-48" />
      </div>
      <div>
        <label className="mb-1 block text-xs">Year</label>
        <input required type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm w-24" />
      </div>
      <button type="submit" disabled={loading}
        className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
        Add Season
      </button>
    </form>
  )
}
