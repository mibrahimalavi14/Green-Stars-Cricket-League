"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AdminNewsForm() {
  const router = useRouter()
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", author: "Admin" })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="font-semibold">Add News Article</h3>
      <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <textarea required value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Content" rows={4}
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <input value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} placeholder="Excerpt (optional)"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <button type="submit" disabled={loading}
        className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
        Publish
      </button>
    </form>
  )
}
