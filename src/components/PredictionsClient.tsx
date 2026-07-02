"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { GoogleSignIn } from "./GoogleSignIn"
import { AuthProvider } from "./AuthProvider"

function PredictionsInner({
  matches,
  userPredictions,
  allPredictions,
  session: _session,
  locked,
}: {
  matches: { id: string; team1: { id: string; name: string; shortName: string; color: string }; team2: { id: string; name: string; shortName: string; color: string }; date: string }[]
  userPredictions: { matchId: string; predictedTeamId: string }[]
  allPredictions: { id: string; userId: string; matchId: string; predictedTeamId: string; user: { name: string; image: string } | null; match: { team1: { id: string; name: string; shortName: string; color: string }; team2: { id: string; name: string; shortName: string; color: string }; date: string } | null }[]
  session: unknown
  locked: boolean
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [predicting, setPredicting] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const userPredictionMap = new Map(userPredictions.map((p) => [p.matchId, p.predictedTeamId]))

  async function handlePredict(matchId: string, teamId: string) {
    if (!session || locked) return
    setLoading(true)
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, teamId }),
      })
      if (res.ok) router.refresh()
    } catch {}
    setLoading(false)
    setPredicting(null)
  }

  if (!session) {
    return <div className="mx-auto max-w-md text-center py-12">
      <h2 className="mb-4 text-xl font-semibold">Sign in to make predictions</h2>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">Use your Google account to predict match winners</p>
      <GoogleSignIn />
    </div>
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 text-xl font-semibold">
          {locked ? "Predictions Closed" : "Upcoming Matches"}
        </h2>
        {matches.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No upcoming matches.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const predicted = userPredictionMap.get(match.id)
              return (
                <div key={match.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-medium">{match.team1.shortName}</span>
                    <span className="text-xs text-[var(--accent)]">VS</span>
                    <span className="font-medium">{match.team2.shortName}</span>
                  </div>
                  {predicted ? (
                    <div className="text-center text-sm text-green-600">
                      Predicted: {predicted === match.team1.id ? match.team1.name : match.team2.name}
                    </div>
                  ) : locked ? (
                    <div className="text-center text-sm text-[var(--muted-foreground)]">Predictions closed</div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePredict(match.id, match.team1.id)}
                        disabled={loading}
                        className="flex-1 rounded bg-[var(--muted)] py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
                        style={predicting === match.id ? { backgroundColor: match.team1.color, color: "white" } : {}}
                      >
                        {match.team1.shortName}
                      </button>
                      <button
                        onClick={() => handlePredict(match.id, match.team2.id)}
                        disabled={loading}
                        className="flex-1 rounded bg-[var(--muted)] py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
                        style={predicting === match.id ? { backgroundColor: match.team2.color, color: "white" } : {}}
                      >
                        {match.team2.shortName}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">All Predictions</h2>
        {allPredictions.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No predictions yet.</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {allPredictions.map((p) => (
              <div key={p.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  {p.user?.image ? (
                    <img src={p.user.image} alt="" className="h-5 w-5 rounded-full" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--muted)] text-[10px]">
                      {p.user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <span className="font-medium">{p.user?.name || "Anonymous"}</span>
                </div>
                <p className="text-[var(--muted-foreground)]">
                  {p.match?.team1.shortName} vs {p.match?.team2.shortName}
                  {p.match && (
                    <span className="ml-2 text-[var(--accent)]">
                      &rarr; {p.predictedTeamId === p.match.team1.id ? p.match.team1.name : p.match.team2.name}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function PredictionsClient(props: Parameters<typeof PredictionsInner>[0]) {
  return (
    <AuthProvider>
      <PredictionsInner {...props} />
    </AuthProvider>
  )
}
