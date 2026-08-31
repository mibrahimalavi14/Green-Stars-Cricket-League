"use client"

import { useState, useEffect } from "react"
import { Star, Trophy, Loader2 } from "lucide-react"

interface MatchData {
  id: string
  matchNo: number
  date: string
  venue: string
  result: string
  status: string
  manOfMatch: string
  team1: { id: string; name: string; shortName: string; logo: string }
  team2: { id: string; name: string; shortName: string; logo: string }
}

interface PotmData {
  winner: {
    playerId: string
    name: string
    team: string
    stats: {
      battingRuns: number
      bowlingWickets: number
      catches: number
    }
  } | null
}

export default function AdminPotmPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [winners, setWinners] = useState<Record<string, PotmData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  async function fetchMatches() {
    const res = await fetch("/api/matches")
    const data = await res.json()
    const completed = (Array.isArray(data) ? data : []).filter((m: MatchData) => m.status === "completed")
    setMatches(completed)
    setLoading(false)
  }

  async function fetchWinner(matchId: string) {
    if (winners[matchId]) return
    const res = await fetch(`/api/potm?matchId=${matchId}`)
    if (!res.ok) return
    const data = await res.json()
    setWinners(prev => ({ ...prev, [matchId]: { winner: data.winner || null } }))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Star className="h-7 w-7 text-[var(--accent)]" />
        Man of the Match (Auto)
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Auto-computed Man of the Match for completed matches</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
          No completed matches yet
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => {
            const w = winners[m.id]?.winner
            return (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)]"
                onClick={() => fetchWinner(m.id)}
              >
                <button
                  className="flex w-full items-center gap-4 p-4 text-left"
                  onClick={() => fetchWinner(m.id)}
                >
                  <div className="flex items-center gap-3">
                    {m.team1.logo && <img src={m.team1.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
                    <div>
                      <p className="font-semibold">{m.team1.shortName} vs {m.team2.shortName}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {new Date(m.date).toLocaleDateString("en-GB")} · Match {m.matchNo || "-"}
                      </p>
                    </div>
                    {m.team2.logo && <img src={m.team2.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {w && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        <Trophy className="h-3 w-3" /> {w.name}
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)]">▼</span>
                  </div>
                </button>

                {w && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                    {m.result && (
                      <p className="mb-3 text-sm text-green-500 font-medium">{m.result}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15">
                        <Trophy className="h-5 w-5 text-[var(--accent)]" />
                      </span>
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {w.team}
                          {w.stats.bowlingWickets > 0 && ` · ${w.stats.bowlingWickets} wkts`}
                          {w.stats.battingRuns > 0 && ` · ${w.stats.battingRuns} runs`}
                          {w.stats.catches > 0 && ` · ${w.stats.catches} catches`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
