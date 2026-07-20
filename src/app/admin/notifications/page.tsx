"use client"

import { useState, useEffect } from "react"
import { BellRing, BellOff, Send, Trash2 } from "lucide-react"
import { PushSubscribeAdmin } from "@/components/PushSubscribe"

type Notification = { id: string; title: string; body: string; type: string; link: string; read: boolean; createdAt: string }

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState("info")
  const [link, setLink] = useState("")

  async function load() {
    const res = await fetch("/api/notifications")
    const d = await res.json()
    setNotifs(d.notifications || [])
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !body) return
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body, type, link }) })
    setTitle(""); setBody(""); setType("info"); setLink("")
    load()
  }

  async function remove(id: string) {
    if (!confirm("Delete this notification?")) return
    await fetch(`/api/notifications/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold">
        <BellRing className="h-8 w-8 text-[var(--accent)]" />
        Notifications
      </h1>

      <div className="mb-10">
        <PushSubscribeAdmin />
      </div>

      <form onSubmit={create} className="mb-10 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BellRing className="h-5 w-5 text-[var(--accent)]" />
          Create In-App Notification
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
              <option value="info">Info</option>
              <option value="match">Match</option>
              <option value="news">News</option>
              <option value="alert">Alert</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">Link (optional)</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/news/some-slug" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
        </div>
        <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">Create Notification</button>
      </form>

      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <BellOff className="h-5 w-5 text-[var(--muted-foreground)]" />
        In-App Notifications History
      </h2>
      <div className="space-y-2">
        {notifs.length === 0 ? (
          <p className="py-8 text-center text-[var(--muted-foreground)]">No notifications yet.</p>
        ) : (
          notifs.map((n) => (
            <div key={n.id} className={`flex items-center justify-between rounded-lg border p-4 ${n.read ? "border-[var(--border)]" : "border-yellow-500/30 bg-yellow-500/5"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{n.title}</span>
                  {!n.read && <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">Unread</span>}
                  <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">{n.type}</span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{n.body}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{new Date(n.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</p>
              </div>
              <button onClick={() => remove(n.id)} className="ml-4 shrink-0 rounded bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-700 transition-opacity hover:opacity-80 dark:text-red-400"><Trash2 className="inline h-3 w-3" /> Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
