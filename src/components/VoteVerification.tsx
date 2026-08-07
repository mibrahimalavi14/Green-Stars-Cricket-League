"use client"

import { useState, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { Check, Loader2, Mail, KeyRound, ShieldCheck } from "lucide-react"

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""

interface VoteVerificationProps {
  email: string
  name: string
  purpose: "potm" | "pos" | "quiz" | "seasonQuiz"
  verifiedToken: string
  onVerified: (token: string) => void
  onReset: () => void
}

export default function VoteVerification({
  email,
  name,
  purpose,
  verifiedToken,
  onVerified,
  onReset,
}: VoteVerificationProps) {
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)

  if (verifiedToken) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-500">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">Email verified &mdash; you can now vote</span>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-xs text-[var(--muted-foreground)] underline-offset-2 hover:underline"
        >
          Change email
        </button>
      </div>
    )
  }

  async function sendOtp() {
    if (!email.trim() || !captchaToken) {
      setError("Please complete the captcha")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/vote/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim(), purpose, recaptchaToken: captchaToken }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || "Failed to send OTP")
      return
    }
    setOtpSent(true)
    setOtp("")
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/vote/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || "Invalid OTP")
      return
    }
    onVerified(data.verifiedToken)
  }

  return (
    <div className="space-y-3">
      {otpSent ? (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
            <KeyRound className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <p className="min-w-0 text-[var(--muted-foreground)]">
              We sent a 6-digit code to <strong>{email}</strong> (expires in 5 min)
            </p>
          </div>
          <input
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-label="One-time password"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-center font-mono text-2xl tracking-[8px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={otp.length !== 6 || loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOtpSent(false)
              setOtp("")
              setError("")
              recaptchaRef.current?.reset()
              setCaptchaToken("")
            }}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Resend OTP / change email
          </button>
        </>
      ) : (
        <>
          <div className="overflow-x-auto">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={SITE_KEY}
              onChange={token => {
                setCaptchaToken(token || "")
                setError("")
              }}
              theme="light"
            />
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={!email.trim() || !captchaToken || loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send OTP
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!verifiedToken && otpSent && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Check className="h-3.5 w-3.5 text-green-500" />
          One vote per email address
        </div>
      )}
    </div>
  )
}
