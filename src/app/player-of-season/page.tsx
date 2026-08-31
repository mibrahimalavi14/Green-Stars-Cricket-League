"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Trophy, Loader2, Crown, Medal } from "lucide-react"

interface SeasonInfo {
  id: string
  name: string
  year: number
}

interface Nominee {
  id: string
  name: string
  role: string
  photo: string
  teamId: string
  teamName: string
  teamShortName: string
  teamLogo: string
  runs: number
  wickets: number
  catches: number
  runOuts: number
  stumpings: number
  innings: number
  impact: number
}

export default function PlayerOfSeasonPage() {
  const [seasons, setSeasons] = useState<SeasonInfo[]>([])
  const [seasonId, setSeasonId] = useState("")
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [winners, setWinners] = useState<Nominee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    fetch("/api/seasons")
      .then(r => r.json())
      .then((data: SeasonInfo[]) => {
        setSeasons(data)
        if (data.length > 0) setSeasonId(data[0].id)
      })
      .catch(() => setError("Failed to load seasons"))
      .finally(() => {
        setLoading(false)
        setInitialized(true)
      })
  }, [])

  const fetchData = useCallback(async (sid: string) => {
    if (!sid) return
    setLoading(true)
    try {
      const res = await fetch(`/api/player-of-season?seasonId=${sid}`)
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setNominees(data.nominees || [])
      setWinners(data.winners || [])
      setError("")
    } catch {
      setError("Failed to load season data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized || !seasonId) return
    fetchData(seasonId)
  }, [seasonId, initialized, fetchData])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-[var(--accent)]" />
        <h1 className="text-3xl font-bold">Player of the Season</h1>
      </div>
      <p className="mb-6 text-[var(--muted-foreground)]">
        Auto-calculated from performance across the season.
      </p>

      {seasons.length > 1 && (
        <div className="mb-6 flex items-center gap-3">
          <label htmlFor="season-select" className="text-sm text-[var(--muted-foreground)]">Season</label>
          <select
            id="season-select"
            value={seasonId}
            onChange={e => setSeasonId(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.year})</option>
            ))}
          </select>
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : nominees.length === 0 ? (
        <p className="py-12 text-center text-[var(--muted-foreground)]">
          No players found for this season yet. Results appear once completed matches exist.
        </p>
      ) : (
        <>
          {winners.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Crown className="h-5 w-5 text-[var(--accent)]" />
                Winner
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {winners.slice(0, 3).map((p, i) => {
                  const isTop = i === 0
                  return (
                    <div
                      key={p.id}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isTop
                          ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg sm:col-span-2"
                          : "border-[var(--border)] bg-[var(--card)]"
                      }`}
                    >
                      {isTop && (
                        <div className="absolute right-3 top-3">
                          <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                            <Crown className="h-3 w-3" /> Player of the Season
                          </span>
                        </div>
                      )}
                      <div className="mb-3 flex items-center gap-3">
                        {p.photo && p.photo !== "/placeholder-player.svg" ? (
                          <img src={p.photo} alt="" className={`${isTop ? "h-16 w-16" : "h-12 w-12"} rounded-full object-cover`} />
                        ) : (
                          <div className={`flex ${isTop ? "h-16 w-16" : "h-12 w-12"} items-center justify-center rounded-full bg-[var(--muted)] text-lg font-bold`}>
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link href={`/players/${p.id}`} className={`${isTop ? "text-xl" : ""} font-semibold hover:text-[var(--accent)] hover:underline`}>
                            {p.name}
                          </Link>
                          <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            {p.teamLogo && <img src={p.teamLogo} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />}
                            {p.teamName} · {p.role}
                          </p>
                        </div>
                      </div>
                      {isTop && (
                        <p className="mb-2 text-sm font-medium text-[var(--accent)]">
                          Impact score: {p.impact}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {p.runs > 0 && (
                          <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 dark:text-blue-400">
                            {p.runs} runs
                          </span>
                        )}
                        {p.wickets > 0 && (
                          <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 dark:text-green-400">
                            {p.wickets} wickets
                          </span>
                        )}
                        {p.catches > 0 && (
                          <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500 dark:text-purple-400">
                            {p.catches} catches
                          </span>
                        )}
                        <span className="rounded-lg bg-[var(--muted)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
                          {p.innings} innings
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Medal className="h-5 w-5 text-[var(--accent)]" />
              Leaderboard by Impact
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {nominees.map(p => (
                <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="mb-3 flex items-center gap-3">
                    {p.photo && p.photo !== "/placeholder-player.svg" ? (
                      <img src={p.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-bold">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/players/${p.id}`} className="font-semibold hover:text-[var(--accent)] hover:underline">
                        {p.name}
                      </Link>
                      <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        {p.teamLogo && <img src={p.teamLogo} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />}
                        {p.teamName} · {p.role}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[var(--accent)]">{p.impact}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {p.runs > 0 && (
                      <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500 dark:text-blue-400">
                        {p.runs} runs
                      </span>
                    )}
                    {p.wickets > 0 && (
                      <span className="rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 dark:text-green-400">
                        {p.wickets} wickets
                      </span>
                    )}
                    {p.catches > 0 && (
                      <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-500 dark:text-purple-400">
                        {p.catches} catches
                      </span>
                    )}
                    <span className="rounded-lg bg-[var(--muted)] px-2 py-1 text-xs text-[var(--muted-foreground)]">
                      {p.innings} innings
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
