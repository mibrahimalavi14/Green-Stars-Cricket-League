"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Mail, KeyRound, Check, Lock, Clock, Trophy } from "lucide-react"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-GB")
}

export default function PredictionsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [season, setSeason] = useState<any>(null)
  const [teamVotes, setTeamVotes] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [predictedTeamId, setPredictedTeamId] = useState<string | null>(null)
  const [predictedTeamName, setPredictedTeamName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"signin" | "otp" | "pick">("signin")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const emailTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const res = await fetch("/api/predictions")
    const data = await res.json()
    if (data.teams) setTeams(data.teams)
    if (data.season) setSeason(data.season)
    if (data.teamVotes) setTeamVotes(data.teamVotes)
    if (data.predictions) setPredictions(data.predictions)
  }

  function handleEmailChange(val: string) {
    setEmail(val)
    setEmailError("")
    setError("")
    if (emailTimer.current) clearTimeout(emailTimer.current)
    if (!val.trim()) return
    emailTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/predictions?email=${encodeURIComponent(val.trim())}`)
      const data = await res.json()
      if (data.prediction) setEmailError("This email has already voted")
    }, 600)
  }

  async function sendOtp() {
    if (!name.trim() || !email.trim()) return
    if (emailError) return
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

    if (predData.teamVotes) setTeamVotes(predData.teamVotes)
    if (predData.predictions) setPredictions(predData.predictions)
    setStep("pick")
    setLoading(false)
  }

  function reset() {
    setName("")
    setEmail("")
    setEmailError("")
    setOtp("")
    setStep("signin")
    setError("")
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
      fetchData()
    }
    setSaving(false)
  }

  const sortedVotes = [...teamVotes].sort((a, b) => b.count - a.count)
  const totalVotes = teamVotes.reduce((s, v) => s + v.count, 0)

  if (success) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h2 className="mb-2 text-lg font-bold">Your vote is locked!</h2>
          <p className="mb-1 text-sm text-[var(--muted-foreground)]">
            You predicted <strong>{predictedTeamName}</strong> will win {season?.name}.
          </p>
          <p className="mb-6 text-xs text-[var(--muted-foreground)]">{name}</p>
          <div className="rounded-lg bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
            <Check className="mr-1 inline h-4 w-4 text-green-500" />
            Vote recorded successfully. Share this page with friends to vote too!
          </div>
        </div>

        <div className="mt-10">
          <VoteResults sortedVotes={sortedVotes} totalVotes={totalVotes} />
          <PredictionsList predictions={predictions} />
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
            <div>
              <input value={email} onChange={e => handleEmailChange(e.target.value)} placeholder="Your email" type="email" required
                className={`w-full rounded-lg border bg-[var(--background)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                  emailError ? "border-red-500" : "border-[var(--border)]"
                }`} />
              {emailError && <p className="mt-1 text-left text-xs text-red-500">{emailError}</p>}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={sendOtp} disabled={!name.trim() || !email.trim() || !!emailError || loading}
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
            Logged in as <strong>{name}</strong>. Pick the team you think will win:
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

      {step !== "pick" && (
        <div className="mt-10">
          <VoteResults sortedVotes={sortedVotes} totalVotes={totalVotes} />
          <PredictionsList predictions={predictions} />
        </div>
      )}
    </div>
  )
}

function VoteResults({ sortedVotes, totalVotes }: { sortedVotes: any[]; totalVotes: number }) {
  if (totalVotes === 0) return null
  return (
    <div className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Trophy className="h-5 w-5 text-[var(--accent)]" />
        Vote Breakdown ({totalVotes} total)
      </h2>
      <div className="space-y-2">
        {sortedVotes.map(v => (
          <div key={v.teamId} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{v.teamName}</span>
              <span className="font-bold text-[var(--accent)]">{v.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${(v.count / totalVotes) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PredictionsList({ predictions }: { predictions: any[] }) {
  if (predictions.length === 0) return null
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Clock className="h-5 w-5 text-[var(--accent)]" />
        Recent Predictions
      </h2>
      <div className="space-y-2">
        {predictions.slice(0, 20).map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm">
            <span><strong>{p.name}</strong> predicted <span className="font-medium text-[var(--accent)]">{p.teamName}</span></span>
            <span className="text-xs text-[var(--muted-foreground)]">{timeAgo(p.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
