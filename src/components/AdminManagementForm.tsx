"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AdminManagementForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", role: "", photo: "", quote: "", sortOrder: "0" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/management", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => null)
    setLoading(false)
    if (!res.ok) {
      setError(data?.error || "Failed to add member")
      return
    }
    setForm({ name: "", role: "", photo: "", quote: "", sortOrder: "0" })
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="font-semibold">Add Management Member</h3>
      <div className="flex flex-wrap gap-3">
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" aria-label="Full name"
          className="min-w-40 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Role (e.g. General Secretary)" aria-label="Role"
          className="min-w-40 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      </div>
      <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="Photo path or URL (public/images/...)" aria-label="Photo"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <textarea value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={3} placeholder="Quote (optional)" aria-label="Quote"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Order
          <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} aria-label="Sort order"
            className="w-20 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </label>
        <button type="submit" disabled={loading}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
          {loading ? "Adding..." : "Add Member"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
}
