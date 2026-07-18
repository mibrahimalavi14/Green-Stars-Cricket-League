"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { getVenueMapsUrl } from "@/lib/utils"

interface LiveMatch {
  id: string
  team1: { id: string; name: string; shortName: string; logo: string; color: string }
  team2: { id: string; name: string; shortName: string; logo: string; color: string }
  team1Score: string
  team2Score: string
  status: string
  result: string
  venue: string
  innings: { id: string; teamId: string; runs: number; wickets: number; balls: number; extras: number; ballsData: string }[]
}

interface UpcomingMatch {
  id: string
  matchNo: number
  team1: { name: string; shortName: string; logo: string; color: string }
  team2: { name: string; shortName: string; logo: string; color: string }
  date: string
  venue: string
}

export function LiveScoreClient({
  liveMatch,
  upcomingMatches,
}: {
  liveMatch: LiveMatch | null
  upcomingMatches: UpcomingMatch[]
}) {
  const [match, setMatch] = useState<LiveMatch | null>(liveMatch)
  const [refreshing, setRefreshing] = useState(false)

  async function refreshScore() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/matches/live")
      if (res.ok) {
        const data = await res.json()
        setMatch(data)
      }
    } catch {}
    setRefreshing(false)
  }

  useEffect(() => {
    const interval = setInterval(refreshScore, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--muted-foreground)]">No live match at the moment.</p>
        {upcomingMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Upcoming Matches</h2>
            <div className="space-y-3 max-w-md mx-auto">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  {(match as any).matchNo > 0 && <div className="mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {(match as any).matchNo}</div>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {match.team1.logo && <img src={match.team1.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                       <span className="font-medium">{match.team1.name}</span>
                    </div>
                    <span className="text-xs text-[var(--accent)]">VS</span>
                    <div className="flex items-center gap-2">
                       <span className="font-medium">{match.team2.name}</span>
                      {match.team2.logo && <img src={match.team2.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                    </div>
                  </div>
                  <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{new Date(match.date).toLocaleDateString()} &middot; {(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const battingTeam = match.innings.length > 0 ? match.innings[0] : null
  const overs = battingTeam ? Math.floor(battingTeam.balls / 6) + "." + (battingTeam.balls % 6) : "0.0"

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={refreshScore}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg bg-[var(--muted)] px-4 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border-2 border-red-500/50 bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="font-semibold text-red-500">LIVE</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              {match.team1.logo && <img src={match.team1.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
               <p className="font-bold">{match.team1.name}</p>
            </div>
            <p className="text-3xl font-bold">{match.team1Score || battingTeam?.runs.toString() || "0"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {battingTeam ? `${battingTeam.runs}/${battingTeam.wickets} (${overs} ov)` : "Yet to bat"}
            </p>
          </div>

          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
               <p className="font-bold">{match.team2.name}</p>
              {match.team2.logo && <img src={match.team2.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
            </div>
            <p className="text-3xl font-bold">{match.team2Score || "0"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">Yet to bat</p>
          </div>
        </div>

        {match.result && (
          <p className="mt-4 text-center text-sm font-medium">{match.result}</p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Ball-by-Ball</h3>
        {battingTeam && battingTeam.ballsData ? (
          <div className="flex flex-wrap gap-2">
            {JSON.parse(battingTeam.ballsData).map((ball: string, i: number) => (
              <span
                key={i}
                className={`inline-flex h-8 w-8 items-center justify-center rounded text-xs font-bold ${
                  ball === "W" ? "bg-red-500 text-white" :
                  ball === "4" ? "bg-blue-500 text-white" :
                  ball === "6" ? "bg-green-500 text-white" :
                  ball === "0" ? "bg-[var(--muted)]" :
                  "bg-[var(--muted)]"
                }`}
              >
                {ball}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No ball data yet.</p>
        )}
      </div>
    </div>
  )
}
