"use client"

import { useState, useEffect, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"

export function BotCheck({ children, storageKey = "bot_verified" }: { children: React.ReactNode; storageKey?: string }) {
  const [verified, setVerified] = useState(false)
  const [mounted, setMounted] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && sessionStorage.getItem(storageKey)) {
      setVerified(true)
    }
  }, [mounted, storageKey])

  if (!mounted) return null

  if (verified) return <>{children}</>

  if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-bold">Verify You Are Human</h2>
        <p className="mb-6 text-sm text-[var(--muted-foreground)]">Please complete the security check to access this page.</p>
        <div className="flex justify-center">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            ref={recaptchaRef}
            onChange={(token) => {
              if (token) {
                sessionStorage.setItem(storageKey, "1")
                setVerified(true)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
