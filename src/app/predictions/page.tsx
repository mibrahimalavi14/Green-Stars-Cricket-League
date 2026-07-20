"use client"

import { useState, useEffect } from "react"
import { Loader2, Mail, KeyRound, Check, Lock } from "lucide-react"

export default function PredictionsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [season, setSeason] = useState<any>(null)
  const [predictedTeamId, setPredictedTeamId] = useState<string | null>(null)
  const [predictedTeamName, setPredictedTeamName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"signin" | "otp" | "voted" | "pick">("signin")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch("/api/predictions").then(r => r.json()).then(data => {
      if (data.teams) setTeams(data.teams)
      if (data.season) setSeason(data.season)
    })
  }, [])

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
      setLoading(false)
      return
    }

    const predRes = await fetch(`/api/predictions?email=${encodeURIComponent(email.trim())}`)
    const predData = await predRes.json()
    if (predData.prediction) {
      setError("This email has already voted")
      setStep("signin")
      setLoading(false)
      return
    }

    setStep("pick")
    setLoading(false)
  }

  function reset() {
    setName("")
    setEmail("")
    setOtp("")
    setStep("signin")
    setError("")
    setSuccess(false)
  }

  async function submitPrediction(teamId: string) {
    setSaving(true)
    setError("")
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim(), predictedTeamId: teamId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Failed to save")
    } else {
      const t = teams.find(t => t.id === teamId)
      setPredictedTeamId(teamId)
      setPredictedTeamName(t?.name || "")
      setSuccess(true)
    }
    setSaving(false)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h2 className="mb-2 text-lg font-bold">Your vote is locked!</h2>
          <p className="mb-1 text-sm text-[var(--muted-foreground)]">
            You predicted <strong>{predictedTeamName}</strong> will win {season?.name}.
          </p>
          <p className="mb-6 text-xs text-[var(--muted-foreground)]">{name} &middot; {email}</p>
          <div className="rounded-lg bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
            <Check className="mr-1 inline h-4 w-4 text-green-500" />
            Vote recorded successfully. Share this page with friends to vote too!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Season Prediction</h1>
        <p className="text-[var(--muted-foreground)]">
          {season ? `Who will win ${season.name} (${season.year})?` : "Predict the season winner"}
        </p>
      </div>

      {step === "signin" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="mb-2 text-lg font-semibold">Verify your email</h2>
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">One vote per email &mdash; enter your details to get started</p>
          <div className="mx-auto max-w-sm space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            <input value={email} onChange={e => { setEmail(e.target.value); setError("") }} placeholder="Your email" type="email" required
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
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Vote"}
            </button>
            <button onClick={reset} className="text-sm text-[var(--accent)] hover:underline">Use a different email</button>
          </div>
        </div>
      ) : (
        <div>
          {error && <div className="mb-4 text-center text-sm text-red-500">{error}</div>}
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Logged in as <strong>{name}</strong> ({email}). Pick the team you think will win:
          </p>
          {teams.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)]">
              No teams found for the current season.
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => submitPrediction(t.id)}
                    disabled={saving}
                    className="flex items-center gap-3 rounded-xl border-2 border-[var(--border)] p-4 text-left transition-all hover:border-[var(--accent)]/50 disabled:opacity-50"
                  >
                    {t.logo && <img src={t.logo} alt="" className="h-10 w-10 rounded-full object-cover" />}
                    <span className="font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
              {saving && <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-[var(--accent)]" />}
            </>
          )}
        </div>
      )}
    </div>
  )
}
