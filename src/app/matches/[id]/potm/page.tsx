"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Star, Medal, Trophy, Loader2 } from "lucide-react"

interface MatchInfo {
  id: string
  matchNo: number
  date: string
  venue: string
  result: string
  status: string
  team1Score: string
  team2Score: string
  team1: { id: string; name: string; shortName: string; logo: string; color: string }
  team2: { id: string; name: string; shortName: string; logo: string; color: string }
}

interface Winner {
  playerId: string
  name: string
  role: string
  team: string
  teamShortName: string
  stats: {
    battingRuns: number
    ballsFaced: number
    fours: number
    sixes: number
    bowlingWickets: number
    bowlingRuns: number
    ballsBowled: number
    catches: number
    runOuts: number
    stumpings: number
  }
}

export default function PotmPage() {
  const params = useParams()
  const matchId = params.id as string

  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/potm?matchId=${matchId}`)
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setMatch(data.match)
        setWinner(data.winner)
      } catch {
        setError("Failed to load match data")
      } finally {
        setLoading(false)
      }
    })()
  }, [matchId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (!match || match.status !== "completed") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-[var(--muted-foreground)]">Man of the Match is not available for this match.</p>
        <Link href="/fixtures" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">Back to Fixtures</Link>
      </div>
    )
  }

  const stats = winner?.stats
  const hasBatting = !!stats && stats.ballsFaced > 0
  const hasBowling = !!stats && stats.ballsBowled > 0
  const hasFielding = !!stats && (stats.catches > 0 || stats.stumpings > 0 || stats.runOuts > 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/matches/${matchId}`} className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">
        &larr; Back to Match
      </Link>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Star className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">Man of the Match</h1>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="text-center shrink-0">
                {match.team1.logo && <img src={match.team1.logo} alt="" className="mx-auto mb-1 h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover" />}
                <p className="text-xs sm:text-sm font-semibold">{match.team1.shortName}</p>
                <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                  {match.team1Score || ""}
                </p>
              </div>
              <span className="text-sm sm:text-lg font-bold text-[var(--muted-foreground)]">vs</span>
              <div className="text-center shrink-0">
                {match.team2.logo && <img src={match.team2.logo} alt="" className="mx-auto mb-1 h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover" />}
                <p className="text-xs sm:text-sm font-semibold">{match.team2.shortName}</p>
                <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                  {match.team2Score || ""}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                {new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-green-500 font-medium truncate max-w-[120px]">{match.result}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
      )}

      {!winner ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">
          No Man of the Match has been awarded for this match.
        </p>
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--accent)]/40 bg-[var(--card)] p-6 text-center shadow-lg">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/15">
              <Trophy className="h-8 w-8 text-[var(--accent)]" />
            </div>
          </div>
          <h2 className="mb-1 text-2xl font-bold">{winner.name}</h2>
          <p className="mb-4 flex items-center justify-center gap-1 text-sm text-[var(--muted-foreground)]">
            <Medal className="h-4 w-4 text-[var(--accent)]" />
            {winner.team} · {winner.role}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {hasBatting && (
              <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 dark:text-blue-400">
                {stats!.battingRuns} runs ({stats!.ballsFaced}b)
                {stats!.ballsFaced > 0 && ` · SR ${((stats!.battingRuns / stats!.ballsFaced) * 100).toFixed(0)}`}
                {stats!.fours > 0 && ` · ${stats!.fours}×4`}
                {stats!.sixes > 0 && ` · ${stats!.sixes}×6`}
              </span>
            )}
            {hasBowling && (
              <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 dark:text-green-400">
                {stats!.bowlingWickets} wkt · {Math.floor(stats!.ballsBowled / 6)}.{stats!.ballsBowled % 6} ov · {stats!.bowlingRuns} runs
              </span>
            )}
            {hasFielding && (
              <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500 dark:text-purple-400">
                {stats!.catches > 0 && `${stats!.catches} catch${stats!.catches > 1 ? "es" : ""}`}
                {stats!.stumpings > 0 && ` · ${stats!.stumpings} stumping${stats!.stumpings > 1 ? "s" : ""}`}
                {stats!.runOuts > 0 && ` · ${stats!.runOuts} run out${stats!.runOuts > 1 ? "s" : ""}`}
              </span>
            )}
            {!hasBatting && !hasBowling && !hasFielding && (
              <span className="text-xs text-[var(--muted-foreground)]">No notable stats</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
