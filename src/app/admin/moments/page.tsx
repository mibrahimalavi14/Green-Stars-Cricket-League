"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trash2, CheckCircle, XCircle } from "lucide-react"

type Moment = {
  id: string
  title: string
  description: string
  imageUrl: string
  link: string
  type: string
  active: boolean
  date: string
}

export default function AdminMomentsPage() {
  const router = useRouter()
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    link: "",
    type: "highlight",
    date: new Date().toISOString().split("T")[0],
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchMoments = useCallback(async () => {
    const res = await fetch("/api/admin/moment/list")
    if (res.ok) {
      const data = await res.json()
      setMoments(data.moments)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMoments()
  }, [fetchMoments])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch("/api/moment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    setForm({ title: "", description: "", imageUrl: "", link: "", type: "highlight", date: new Date().toISOString().split("T")[0] })
    fetchMoments()
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch("/api/admin/moment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !current }),
    })
    fetchMoments()
  }

  async function deleteMoment(id: string) {
    if (!confirm("Delete this moment?")) return
    await fetch(`/api/admin/moment?id=${id}`, { method: "DELETE" })
    fetchMoments()
  }

  const typeOptions = [
    { value: "highlight", label: "Highlight" },
    { value: "milestone", label: "Milestone" },
    { value: "celebration", label: "Celebration" },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Moment of the Day</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="font-semibold">Add New Moment</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title"
            className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3}
          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="Image URL (optional)"
            className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
          <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="Link URL (optional)"
            className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
          className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
          {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button type="submit" disabled={submitting}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
          {submitting ? "Creating..." : "Create Moment"}
        </button>
      </form>

      {loading ? (
        <p className="text-center py-8 text-[var(--muted-foreground)]">Loading...</p>
      ) : moments.length === 0 ? (
        <p className="text-center py-8 text-[var(--muted-foreground)]">No moments yet.</p>
      ) : (
        <div className="space-y-3">
          {moments.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.title}</p>
                  <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">{m.type}</span>
                  {m.active ? (
                    <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="h-3 w-3" /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><XCircle className="h-3 w-3" /> Inactive</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                {m.description && <p className="mt-1 text-sm line-clamp-1">{m.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => toggleActive(m.id, m.active)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${m.active ? "bg-green-900/30 text-green-400 hover:bg-green-900/50" : "bg-[var(--muted)] hover:bg-[var(--muted)]/70"}`}>
                  {m.active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteMoment(m.id)}
                  className="rounded p-1 text-red-500 transition-colors hover:bg-red-900/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
