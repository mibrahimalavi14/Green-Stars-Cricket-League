"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { SessionProvider } from "next-auth/react"
import { Trophy, LogIn, LogOut, Check, Loader2 } from "lucide-react"

function PredictionsInner() {
  const { data: session, status } = useSession()
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/matches").then(r => r.json()).then(data => {
      const upcoming = (Array.isArray(data) ? data : []).filter((m: any) => m.status === "upcoming")
      setMatches(upcoming)
    })
    if (session?.user?.id) {
      fetch("/api/predictions").then(r => r.json()).then((data: any) => {
        const map: Record<string, string> = {}
        if (Array.isArray(data)) data.forEach((p: any) => {
          map[p.matchId] = p.predictedTeamId
        })
        setPredictions(map)
      })
    }
  }, [session])

  async function predict(matchId: string, teamId: string) {
    setSaving(matchId)
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, teamId }),
    })
    if (res.ok) {
      setPredictions(prev => ({ ...prev, [matchId]: teamId }))
      setSaved(matchId)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  if (status === "loading") return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" /></div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Match Predictions</h1>
          <p className="text-[var(--muted-foreground)]">Predict the winner for upcoming matches</p>
        </div>
        {session ? (
          <div className="flex items-center gap-3">
            {session.user?.image && <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />}
            <span className="text-sm font-medium">{session.user?.name}</span>
            <button onClick={() => signOut()} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <button onClick={() => signIn("google")} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">
            <LogIn className="h-4 w-4" /> Sign in with Google
          </button>
        )}
      </div>

      {!session && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="mb-2 text-lg font-semibold">Sign in to make predictions</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">Predict match winners and track your accuracy</p>
          <button onClick={() => signIn("google")} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90">
            <LogIn className="h-4 w-4" /> Sign in with Google
          </button>
        </div>
      )}

      {session && matches.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--muted-foreground)]">No upcoming matches to predict.</p>
        </div>
      )}

      {session && matches.length > 0 && (
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

      {session && Object.keys(predictions).length > 0 && (
        <div className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm text-center text-[var(--muted-foreground)]">
          <Check className="mr-1 inline h-3.5 w-3.5 text-green-500" />
          You have predicted {Object.keys(predictions).length} match{Object.keys(predictions).length !== 1 ? "es" : ""}
        </div>
      )}
    </div>
  )
}

export default function PredictionsPage() {
  return <SessionProvider><PredictionsInner /></SessionProvider>
}
