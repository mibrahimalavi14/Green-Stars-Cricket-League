"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { Loader2, Check, Lock, Clock, Trophy } from "lucide-react"
import { Confetti } from "@/components/CoolEffects"
import { GoogleSignIn } from "@/components/GoogleSignIn"

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
  const { data: session, status } = useSession()
  const email = session?.user?.email?.toLowerCase()
  const [teams, setTeams] = useState<any[]>([])
  const [season, setSeason] = useState<any>(null)
  const [teamVotes, setTeamVotes] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [predictedTeamId, setPredictedTeamId] = useState<string | null>(null)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [alreadyVotedAt, setAlreadyVotedAt] = useState<string | null>(null)
  const [votedAt, setVotedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [signInError, setSignInError] = useState("")
  const [success, setSuccess] = useState(false)
  const checkedRef = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) {
      setSignInError(
        err === "Configuration"
          ? "Something went wrong while signing in. Please try again."
          : `Sign in failed (${err}). Please try again.`
      )
      params.delete("error")
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`
      window.history.replaceState({}, "", clean)
    }
  }, [])

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

  useEffect(() => {
    if (status !== "authenticated" || !email || checkedRef.current === email) return
    checkedRef.current = email
    fetch(`/api/predictions?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.prediction) {
          setAlreadyVoted(true)
          setAlreadyVotedAt(data.prediction.createdAt ? new Date(data.prediction.createdAt).toISOString() : null)
          setPredictedTeamId(data.prediction.predictedTeamId)
        }
      })
      .catch(() => {})
  }, [status, email, teams])

  async function submitPrediction(teamId: string) {
    setSaving(true)
    setError("")
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictedTeamId: teamId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Failed to save")
    } else {
      const t = teams.find(t => t.id === teamId)
      setPredictedTeamId(teamId)
      setVotedAt(data.createdAt ? new Date(data.createdAt).toISOString() : null)
      setSuccess(true)
      fetchData()
    }
    setSaving(false)
  }

  const sortedVotes = [...teamVotes].sort((a, b) => b.count - a.count)
  const totalVotes = teamVotes.reduce((s, v) => s + v.count, 0)
  const displayName = session?.user?.name || (email ? email.split("@")[0] : "")
  const predictedTeamName = teams.find(t => t.id === predictedTeamId)?.name || ""

  if (success) {
    return (
      <>
        <Confetti trigger={success} />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <h2 className="mb-2 text-lg font-bold">Your vote is locked!</h2>
            <p className="mb-1 text-sm text-[var(--muted-foreground)]">
              You predicted <strong>{predictedTeamName}</strong> will win {season?.name}.
            </p>
            <p className="mb-6 text-xs text-[var(--muted-foreground)]">
              {displayName}
              {votedAt && <span className="ml-1">· {timeAgo(votedAt)}</span>}
            </p>
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
      </>
    )
  }

  if (status === "loading") {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">Loading&hellip;</p>
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

      {status === "unauthenticated" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-[var(--accent)]" />
          <h2 className="mb-2 text-lg font-semibold">Sign in to vote</h2>
          {signInError && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {signInError}
            </div>
          )}
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">
            One vote per Google account &mdash; sign in to make your prediction
          </p>
          <div className="mx-auto max-w-sm">
            <GoogleSignIn callbackUrl="/predictions" />
          </div>
        </div>
      ) : alreadyVoted ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="mb-2 text-lg font-semibold">You&apos;ve already voted</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            You predicted <strong>{predictedTeamName}</strong> will win {season?.name}.
          </p>
          {alreadyVotedAt && (
            <p className="mb-6 mt-1 text-xs text-[var(--muted-foreground)]">Voted {timeAgo(alreadyVotedAt)}</p>
          )}
          <div className="mx-auto max-w-sm">
            <button
              onClick={() => signOut({ callbackUrl: "/predictions" })}
              className="w-full rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Use a different account
            </button>
          </div>
        </div>
      ) : (
        <div>
          {error && <div className="mb-4 text-center text-sm text-red-500">{error}</div>}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Logged in as <strong>{displayName}</strong>. Pick the team you think will win:
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/predictions" })}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Sign out
            </button>
          </div>
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

      {status !== "authenticated" || alreadyVoted ? (
        <div className="mt-10">
          <VoteResults sortedVotes={sortedVotes} totalVotes={totalVotes} />
          <PredictionsList predictions={predictions} />
        </div>
      ) : null}
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
          <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm min-w-0">
            <span className="truncate min-w-0"><strong>{p.name}</strong> predicted <span className="font-medium text-[var(--accent)]">{p.teamName}</span></span>
            <span className="text-xs text-[var(--muted-foreground)] shrink-0">{timeAgo(p.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
