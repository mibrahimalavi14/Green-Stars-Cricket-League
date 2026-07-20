"use client"

import { useState, useEffect } from "react"
import { Trophy, Check, Loader2, Mail, KeyRound, Lock } from "lucide-react"

export default function PredictionsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [season, setSeason] = useState<any>(null)
  const [predictedTeamId, setPredictedTeamId] = useState<string | null>(null)
  const [predictedTeamName, setPredictedTeamName] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"loading" | "signin" | "otp" | "done">("loading")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("gscl_user")
    if (stored) {
      const u = JSON.parse(stored)
      setName(u.name)
      setEmail(u.email)
      initUser(u.email)
    } else {
      setStep("signin")
    }
  }, [])

  async function initUser(emailParam: string) {
    const res = await fetch(`/api/predictions?email=${encodeURIComponent(emailParam)}`)
    const data = await res.json()
    if (data.teams) setTeams(data.teams)
    if (data.season) setSeason(data.season)
    if (data.prediction) {
      setPredictedTeamId(data.prediction.predictedTeamId)
      const t = data.teams?.find((t: any) => t.id === data.prediction.predictedTeamId)
      if (t) setPredictedTeamName(t.name)
    }
    setStep("done")
  }

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
    } else {
      localStorage.setItem("gscl_user", JSON.stringify({ name: data.name, email: email.trim(), id: data.userId }))
      initUser(email.trim())
    }
    setLoading(false)
  }

  function resendOtp() {
    setOtp("")
    setStep("signin")
  }

  async function submitPrediction(teamId: string) {
    setSaving(true)
    setError("")
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, predictedTeamId: teamId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Failed to save")
    } else {
      const t = teams.find(t => t.id === teamId)
      setPredictedTeamId(teamId)
      setPredictedTeamName(t?.name || "")
      setSaved(true)
    }
    setSaving(false)
  }

  const alreadyPredicted = !!predictedTeamId

  if (step === "loading") {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Season Prediction</h1>
          <p className="text-[var(--muted-foreground)]">
            {season ? `Predict the winner of ${season.name} (${season.year})` : "Predict the season winner"}
          </p>
        </div>
      </div>

      {step === "signin" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="mb-2 text-lg font-semibold">Verify your email</h2>
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">One vote per email &mdash; prediction cannot be changed later</p>
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
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Vote"}
            </button>
            <button onClick={resendOtp} className="text-sm text-[var(--accent)] hover:underline">Use a different email</button>
          </div>
        </div>
      ) : teams.length === 0 && !alreadyPredicted ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted-foreground)]">No teams found for the current season.</p>
        </div>
      ) : (
        <div>
          {alreadyPredicted ? (
            <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/20 p-6 text-center">
              <Lock className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <h3 className="text-lg font-bold">Your vote is locked!</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                You predicted <strong>{predictedTeamName}</strong> will win {season?.name}.
                This cannot be changed.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span>Voted as <strong>{name}</strong></span>
                <span className="text-[var(--border)]">|</span>
                <span><strong>{email}</strong></span>
              </div>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 text-center text-sm text-red-500">{error}</div>}
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">Pick the team you think will win the season. You can only vote once.</p>
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
