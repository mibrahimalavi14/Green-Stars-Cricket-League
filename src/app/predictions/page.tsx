"use client"

import { useState, useEffect } from "react"
import { Trophy, Check, Loader2, User, Mail, KeyRound } from "lucide-react"

export default function PredictionsPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"signin" | "otp" | "done">("signin")
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState("")
  const [verifiedEmail, setVerifiedEmail] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("gscl_user")
    if (stored) {
      const u = JSON.parse(stored)
      setName(u.name)
      setEmail(u.email)
      setVerifiedEmail(u.email)
      setUserId(u.id)
      setStep("done")
    }
    fetch("/api/matches").then(r => r.json()).then(data => {
      const upcoming = (Array.isArray(data) ? data : []).filter((m: any) => m.status === "upcoming")
      setMatches(upcoming)
    })
  }, [])

  useEffect(() => {
    if (userId) {
      fetch("/api/predictions").then(r => r.json()).then((data: any) => {
        const map: Record<string, string> = {}
        if (Array.isArray(data)) data.forEach((p: any) => {
          if (p.userId === userId) map[p.matchId] = p.predictedTeamId
        })
        setPredictions(map)
      })
    }
  }, [userId])

  async function sendOtp() {
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError("")
    const res = await fetch("/api/predictions/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Failed to send OTP")
    } else {
      setOtpSent(true)
      setStep("otp")
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!otp.trim()) return
    setLoading(true)
    setError("")
    const res = await fetch("/api/predictions/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), name: name.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Invalid OTP")
    } else {
      localStorage.setItem("gscl_user", JSON.stringify({ name: data.name, email: email.trim(), id: data.userId }))
      setUserId(data.userId)
      setVerifiedEmail(email.trim())
      setStep("done")
    }
    setLoading(false)
  }

  function signOutUser() {
    localStorage.removeItem("gscl_user")
    setName("")
    setEmail("")
    setOtp("")
    setStep("signin")
    setUserId(null)
    setPredictions({})
    setVerifiedEmail("")
  }

  function resendOtp() {
    setOtp("")
    setOtpSent(false)
    setStep("signin")
  }

  async function predict(matchId: string, teamId: string) {
    if (!userId) return
    setSaving(matchId)
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, teamId, userId, name, email }),
    })
    if (res.ok) {
      setPredictions(prev => ({ ...prev, [matchId]: teamId }))
      setSaved(matchId)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Match Predictions</h1>
          <p className="text-[var(--muted-foreground)]">Predict the winner for upcoming matches</p>
        </div>
        {step === "done" ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{name}</span>
            <button onClick={signOutUser} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]">
              Sign Out
            </button>
          </div>
        ) : null}
      </div>

      {step === "signin" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="mb-2 text-lg font-semibold">Verify your email</h2>
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">Enter your details and we'll send a one-time code to your email</p>
          <div className="mx-auto max-w-sm space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" type="email" required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={sendOtp} disabled={!name.trim() || !email.trim() || loading}
              className="w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send OTP"}
            </button>
          </div>
        </div>
      ) : step === "otp" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <KeyRound className="mx-auto mb-3 h-10 w-10 text-[var(--accent)]" />
          <h2 className="mb-2 text-lg font-semibold">Check your email</h2>
          <p className="mb-1 text-sm text-[var(--muted-foreground)]">We sent a 6-digit code to <strong>{email}</strong></p>
          <p className="mb-6 text-xs text-[var(--muted-foreground)]">Expires in 5 minutes</p>
          <div className="mx-auto max-w-xs space-y-3">
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
              className="w-full text-center text-2xl tracking-[8px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={verifyOtp} disabled={otp.length !== 6 || loading}
              className="w-full rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Start Predicting"}
            </button>
            <button onClick={resendOtp} className="text-sm text-[var(--accent)] hover:underline">Use a different email</button>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted-foreground)]">No upcoming matches to predict.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-1 text-xs text-[var(--muted-foreground)]">
                {new Date(m.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} &middot; {m.venue}
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => predict(m.id, m.team1Id)}
                  disabled={saving === m.id}
                  className={`flex flex-1 items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                    predictions[m.id] === m.team1Id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  {m.team1.logo && <img src={m.team1.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
                  <span className="font-medium">{m.team1.name}</span>
                  {predictions[m.id] === m.team1Id && saved === m.id && <Check className="ml-auto h-4 w-4 text-green-500" />}
                  {saving === m.id && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                </button>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">VS</span>
                <button
                  onClick={() => predict(m.id, m.team2Id)}
                  disabled={saving === m.id}
                  className={`flex flex-1 items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                    predictions[m.id] === m.team2Id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  {m.team2.logo && <img src={m.team2.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
                  <span className="font-medium">{m.team2.name}</span>
                  {predictions[m.id] === m.team2Id && saved === m.id && <Check className="ml-auto h-4 w-4 text-green-500" />}
                  {saving === m.id && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === "done" && Object.keys(predictions).length > 0 && (
        <div className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm text-center text-[var(--muted-foreground)]">
          <Check className="mr-1 inline h-3.5 w-3.5 text-green-500" />
          You have predicted {Object.keys(predictions).length} match{Object.keys(predictions).length !== 1 ? "es" : ""}
        </div>
      )}
    </div>
  )
}
