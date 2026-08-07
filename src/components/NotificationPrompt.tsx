"use client"

import { useState, useEffect } from "react"
import { BellRing } from "lucide-react"
import { isPushSupported, getPushSubscription, subscribeToPush } from "@/lib/push-client"

const DISMISS_KEY = "gscl_notif_prompt_dismissed_at"
const REPROMPT_DAYS = 7

export function NotificationPrompt() {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "failed">("idle")
  const [offset, setOffset] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(async () => {
      if (!isPushSupported()) return
      if (!("Notification" in window) || Notification.permission === "denied") return
      const existing = await getPushSubscription()
      if (existing) return
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (dismissedAt && Date.now() - dismissedAt < REPROMPT_DAYS * 24 * 60 * 60 * 1000) return
      setOffset(!localStorage.getItem("cookie_consent"))
      setShow(true)
    }, 1500)
    return () => window.clearTimeout(t)
  }, [])

  async function allow() {
    setBusy(true)
    const result = await subscribeToPush()
    if (result.ok) {
      setStatus("success")
      window.setTimeout(() => setShow(false), 1800)
    } else {
      setStatus("failed")
      if (result.message === "Permission denied") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
      }
      window.setTimeout(() => setShow(false), 2600)
    }
    setBusy(false)
  }

  function notNow() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Enable notifications"
      className={`fixed left-0 right-0 z-[70] ${offset ? "bottom-16" : "bottom-0"}`}
    >
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15">
              <BellRing className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Get notified from GSCL</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {status === "success"
                  ? "Notifications enabled. You're all set!"
                  : status === "failed"
                    ? "Couldn't enable notifications. Use the footer toggle."
                    : "Match results, quiz alerts & news — right on this device."}
              </p>
            </div>
          </div>
          {status === "idle" && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={allow}
                disabled={busy}
                className="min-h-11 rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Please wait..." : "Allow notifications"}
              </button>
              <button
                onClick={notNow}
                className="min-h-11 rounded-lg bg-[var(--muted)] px-4 text-xs font-medium transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
