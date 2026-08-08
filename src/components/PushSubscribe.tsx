"use client"

import { useState, useEffect } from "react"
import { BellRing, BellOff, Send, Smartphone, Trash2 } from "lucide-react"
import {
  isPushSupported,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  PUSH_SUBSCRIBED_EVENT,
  PUSH_UNSUBSCRIBED_EVENT,
} from "@/lib/push-client"

export function PushSubscribe() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!isPushSupported()) return
    setSupported(true)
    const refresh = () => getPushSubscription().then((sub) => setSubscribed(!!sub))
    refresh()
    window.addEventListener(PUSH_SUBSCRIBED_EVENT, refresh)
    window.addEventListener(PUSH_UNSUBSCRIBED_EVENT, refresh)
    return () => {
      window.removeEventListener(PUSH_SUBSCRIBED_EVENT, refresh)
      window.removeEventListener(PUSH_UNSUBSCRIBED_EVENT, refresh)
    }
  }, [])

  async function toggle() {
    setLoading(true)
    const result = subscribed ? await unsubscribeFromPush() : await subscribeToPush()
    setSubscribed(!!(await getPushSubscription()))
    setMsg(result.message)
    setLoading(false)
  }

  if (!supported || msg === "Permission denied") return null

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-medium transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
      >
        {subscribed ? (
          <>
            <BellOff className="h-3.5 w-3.5" />
            Disable Notifications
          </>
        ) : (
          <>
            <BellRing className="h-3.5 w-3.5" />
            Enable Push Notifications
          </>
        )}
      </button>
      {msg && <p className="text-[10px] text-[var(--muted-foreground)]">{msg}</p>}
    </div>
  )
}

export function PushSubscribeAdmin() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [link, setLink] = useState("")
  const [subCount, setSubCount] = useState(0)
  const [subs, setSubs] = useState<{ id: string; device: string; createdAt: string }[]>([])
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState("")

  async function loadSubs() {
    fetch("/api/notifications/subscribe-count")
      .then((r) => r.json())
      .then((d) => {
        setSubCount(d.count || 0)
        setSubs(d.subscriptions || [])
      })
      .catch(() => {})
  }

  useEffect(() => { loadSubs() }, [])

  async function removeSub(id: string) {
    if (!confirm("Remove this subscriber?")) return
    await fetch(`/api/notifications/subscribe/${id}`, { method: "DELETE" })
    loadSubs()
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !body) return
    setSending(true)
    setResult("")
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": "gscl-admin-2024" },
        body: JSON.stringify({ title, body, link }),
      })
      const data = await res.json()
      if (data.sent !== undefined) {
        setResult(`Sent to ${data.sent} subscribers (${data.failed} failed)`)
        setTitle(""); setBody(""); setLink("")
        loadSubs()
      } else {
        setResult(data.error || "Failed to send")
      }
    } catch {
      setResult("Network error")
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <BellRing className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Push Notification Subscribers</h2>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Active subscribers: <span className="font-bold text-[var(--accent)]">{subCount}</span>
        </p>

        <div className="mt-4 space-y-2">
          {subs.length === 0 ? (
            <p className="py-2 text-center text-xs text-[var(--muted-foreground)]">No subscriptions yet.</p>
          ) : (
            subs.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Smartphone className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.device}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {new Date(s.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeSub(s.id)}
                  className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-red-500/20 px-2.5 text-xs font-semibold text-red-700 transition-opacity hover:opacity-80 dark:text-red-400"
                  aria-label={`Remove ${s.device}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={send} className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Send className="h-5 w-5 text-[var(--accent)]" />
          Send Push Notification
        </h2>
        <div>
          <label className="mb-1 block text-xs font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/news/some-slug"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send to All Subscribers"}
        </button>
        {result && <p className="text-sm text-[var(--muted-foreground)]">{result}</p>}
      </form>
    </div>
  )
}
