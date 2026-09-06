"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Defaults = {
  id?: string
  name: string
  title: string
  message: string
  photo: string
  showSignature: boolean
  active: boolean
}

export function AdminChairmanMessageForm({ defaults }: { defaults?: Defaults | null }) {
  const router = useRouter()
  const [form, setForm] = useState<Defaults>({
    id: defaults?.id || "",
    name: defaults?.name || "Hafiz Muhammad Ibrahim Alavi",
    title: defaults?.title || "Chairman, Green Stars Cricket League",
    message: defaults?.message || "",
    photo: defaults?.photo || "/images/management/Chairman Muhammad Ibrahim Alavi.png",
    showSignature: defaults ? defaults.showSignature : true,
    active: defaults ? defaults.active : true,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/admin/chairman-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Chairman&apos;s Message</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
          Visible on home page
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" aria-label="Name"
          className="min-w-48 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title / Designation" aria-label="Title"
          className="min-w-48 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      </div>
      <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="Photo path or URL" aria-label="Photo"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={8}
        placeholder="Message — har paragraph ke baad ek khaali line chhoren (paragraphs alag ho jayenge)"
        className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.showSignature} onChange={e => setForm({ ...form, showSignature: e.target.checked })} className="h-4 w-4" />
        Show signature below name
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={loading}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50">
          {loading ? "Saving..." : "Save Message"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Delete button page ke neeche hai — delete karne par home page purana default message dikhata hai.
      </p>
    </form>
  )
}
