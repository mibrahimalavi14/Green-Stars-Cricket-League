"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem("cookie_consent")
    if (!accepted) setShow(true)
  }, [])

  function accept() {
    localStorage.setItem("cookie_consent", "true")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-4 md:items-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          This website uses cookies to enhance your experience. By continuing, you agree to our use of cookies.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={accept} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">Accept</button>
          <button onClick={() => setShow(false)} className="rounded-lg bg-[var(--muted)] p-2 transition-colors hover:bg-[var(--accent)]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
