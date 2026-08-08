"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BellRing, X } from "lucide-react"

const DISMISSED_KEY = "gscl:notif-toast-dismissed"
const RECENT_MS = 7 * 24 * 60 * 60 * 1000

type Notification = { id: string; title: string; body: string; type: string; link: string; read: boolean; createdAt: string }

export function NotificationToast() {
  const pathname = usePathname()
  const [queue, setQueue] = useState<Notification[]>([])
  const [current, setCurrent] = useState<Notification | null>(null)

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return
    setQueue([])
    setCurrent(null)
  }, [pathname])

  const getDismissed = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")
    } catch {
      return []
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      const d = await res.json()
      const dismissed = new Set(getDismissed())
      const now = Date.now()
      const pending = ((d.notifications || []) as Notification[]).filter((n) => {
        const age = now - new Date(n.createdAt).getTime()
        return age >= 0 && age < RECENT_MS && !dismissed.has(n.id)
      })
      setQueue(pending)
    } catch {}
  }, [getDismissed])

  useEffect(() => {
    load()
    const iv = setInterval(load, 60000)
    const onFocus = () => load()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(iv)
      window.removeEventListener("focus", onFocus)
    }
  }, [load])

  useEffect(() => {
    if (!current && queue.length > 0) setCurrent(queue[0])
  }, [queue, current])

  function dismiss() {
    if (!current) return
    try {
      const list = getDismissed()
      if (!list.includes(current.id)) {
        list.push(current.id)
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(list.slice(-50)))
      }
    } catch {}
    setQueue((q) => q.filter((n) => n.id !== current.id))
    setCurrent(null)
  }

  async function open() {
    if (!current) return
    if (!current.read) {
      fetch(`/api/notifications/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) }).catch(() => {})
    }
    dismiss()
  }

  if (!current || pathname.startsWith("/admin")) return null

  const inner = (
    <div className="flex w-full items-start gap-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-4 shadow-xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15">
        <BellRing className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{current.title}</p>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{current.body}</p>
        {current.link && <p className="mt-1 text-xs font-semibold text-[var(--accent)]">View &rarr;</p>}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          dismiss()
        }}
        aria-label="Dismiss notification"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-x-0 top-[3.5rem] z-[60] px-4">
      <div className="animate-toast-in mx-auto max-w-3xl">
        {current.link ? (
          <Link href={current.link} onClick={open}>
            {inner}
          </Link>
        ) : (
          <div onClick={open}>{inner}</div>
        )}
      </div>
    </div>
  )
}
