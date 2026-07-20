"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, GripVertical } from "lucide-react"

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [name, setName] = useState("")
  const [logo, setLogo] = useState("")
  const [website, setWebsite] = useState("")
  const [tier, setTier] = useState("platinum")
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchSponsors() }, [])

  async function fetchSponsors() {
    const res = await fetch("/api/sponsors")
    const data = await res.json()
    setSponsors(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function addSponsor() {
    if (!name.trim()) return
    setAdding(true)
    await fetch("/api/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), logo: logo.trim(), website: website.trim(), tier }),
    })
    setName(""); setLogo(""); setWebsite(""); setTier("platinum")
    setAdding(false)
    fetchSponsors()
  }

  async function deleteSponsor(id: string) {
    if (!confirm("Delete this sponsor?")) return
    await fetch(`/api/sponsors?id=${id}`, { method: "DELETE" })
    fetchSponsors()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Sponsors</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Manage sponsors displayed on the homepage</p>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 font-semibold">Add Sponsor</h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Sponsor name" required className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
            <input value={logo} onChange={e => setLogo(e.target.value)} placeholder="Logo URL" className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm" />
            <select value={tier} onChange={e => setTier(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm">
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
            <button onClick={addSponsor} disabled={!name.trim() || adding} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : sponsors.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">No sponsors yet</div>
      ) : (
        <div className="space-y-2">
          {sponsors.map(s => (
            <div key={s.id} className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <GripVertical className="h-4 w-4 text-[var(--muted-foreground)]" />
              {s.logo && <img src={s.logo} alt="" className="h-10 w-10 rounded-lg object-contain" />}
              <div className="flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{s.tier} {s.website && `· ${s.website}`}</p>
              </div>
              <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs capitalize">{s.tier}</span>
              <button onClick={() => deleteSponsor(s.id)} className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
