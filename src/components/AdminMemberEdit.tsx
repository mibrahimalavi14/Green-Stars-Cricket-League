"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Member = {
  id: string
  name: string
  role: string
  photo: string
  quote: string
  sortOrder: number
  active: boolean
}

export function AdminMemberEdit({ member, onClose }: { member: Member; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: member.name, role: member.role, photo: member.photo, quote: member.quote, sortOrder: String(member.sortOrder), active: member.active })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch(`/api/management/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) || 0 }),
    })
    const data = await res.json().catch(() => null)
    setLoading(false)
    if (!res.ok) {
      setError(data?.error || "Failed to save")
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-3">
      <h4 className="text-sm font-semibold">Edit {member.name}</h4>
      <div className="flex flex-wrap gap-3">
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} aria-label="Full name"
          className="min-w-40 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} aria-label="Role"
          className="min-w-40 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      </div>
      <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="Photo path or URL" aria-label="Photo"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <textarea value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={2} placeholder="Quote (optional)" aria-label="Quote"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          Order
          <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} aria-label="Sort order"
            className="w-20 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
          Visible on website
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={loading}
            className="rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onClose}
            className="rounded border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--muted)]">
            Cancel
          </button>
        </div>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  )
}
