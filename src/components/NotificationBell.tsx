"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"

type Notification = { id: string; title: string; body: string; type: string; link: string; read: boolean; createdAt: string }

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    const res = await fetch("/api/notifications")
    const d = await res.json()
    setNotifs(d.notifications || [])
    setUnread(d.unread || 0)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) })
    load()
  }

  async function markAllRead() {
    await Promise.all(notifs.filter((n) => !n.read).map((n) =>
      fetch(`/api/notifications/${n.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) })
    ))
    load()
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) load() }} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <button onClick={markAllRead} className="text-xs text-[var(--accent)] hover:underline">Mark all read</button>}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No notifications yet.</p>
            ) : (
              notifs.map((n) => {
                const inner = (
                  <div className={`flex gap-3 border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--muted)]/50 ${n.read ? "" : "bg-[var(--accent)]/5"}`}>
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-[var(--accent)]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${n.read ? "" : "font-semibold"}`}>{n.title}</p>
                      <p className="line-clamp-2 text-xs text-[var(--muted-foreground)]">{n.body}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{new Date(n.createdAt).toLocaleDateString("en-PK")}</p>
                    </div>
                  </div>
                )
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => { if (!n.read) markRead(n.id); setOpen(false) }}>{inner}</Link>
                ) : (
                  <div key={n.id} onClick={() => { if (!n.read) markRead(n.id) }}>{inner}</div>
                )
              })
            )}
          </div>

          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-[var(--border)] px-4 py-2.5 text-center text-xs text-[var(--accent)] hover:underline">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
