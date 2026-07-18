"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Notification = { id: string; title: string; body: string; type: string; link: string; read: boolean; createdAt: string }

const typeColors: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  match: "bg-green-500/20 text-green-700 dark:text-green-400",
  news: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  alert: "bg-red-500/20 text-red-700 dark:text-red-400",
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])

  async function load() {
    const res = await fetch("/api/notifications")
    const d = await res.json()
    setNotifs(d.notifications || [])
  }

  useEffect(() => { load() }, [])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) })
    load()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Notifications</h1>

      {notifs.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div key={n.id} onClick={() => { if (!n.read) markRead(n.id) }} className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-[var(--muted)]/30 ${n.read ? "border-[var(--border)]" : "border-[var(--accent)]/30 bg-[var(--accent)]/5"}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />}
                  <span className={`truncate text-sm font-semibold ${n.read ? "text-[var(--muted-foreground)]" : ""}`}>{n.title}</span>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${typeColors[n.type] || typeColors.info}`}>{n.type}</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{n.body}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span>{new Date(n.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</span>
                {n.link && <Link href={n.link} className="text-[var(--accent)] hover:underline" onClick={(e) => e.stopPropagation()}>View details →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
