"use client"

import { useState, useEffect } from "react"
import { BellRing, BellOff, Send } from "lucide-react"

export function PushSubscribe() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub)
      })
    })
  }, [])

  async function toggle() {
    if (subscribed) {
      setLoading(true)
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch("/api/notifications/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
          setSubscribed(false)
          setMsg("Notifications disabled")
        }
      } catch {
        setMsg("Failed to unsubscribe")
      }
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setMsg("Permission denied")
        setLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BEl62iZR8e8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8RZ8",
      })

      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        }),
      })

      setSubscribed(true)
      setMsg("Notifications enabled!")
    } catch {
      setMsg("Failed to enable notifications")
    }
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
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState("")

  useEffect(() => {
    fetch("/api/notifications/subscribe-count")
      .then((r) => r.json())
      .then((d) => setSubCount(d.count || 0))
      .catch(() => {})
  }, [])

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
