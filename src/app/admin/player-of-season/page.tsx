"use client"

import { useState, useEffect } from "react"
import { Trophy, Loader2, Vote, Crown, Check, Clock } from "lucide-react"
import { formatDateTimePKT } from "@/lib/utils"

interface SeasonData {
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
  innings: number
  impact: number
  votes: number
}

interface SeasonVotes {
  nominees: Nominee[]
  totalVotes: number
  recentVotes: { name: string; playerName: string; createdAt: string }[]
}

interface AwardInfo {
  id: string
  category: string
  playerId: string
  player?: { id: string; name: string } | null
}

export default function AdminPlayerOfSeasonPage() {
  const [seasons, setSeasons] = useState<SeasonData[]>([])
  const [seasonVotes, setSeasonVotes] = useState<Record<string, SeasonVotes>>({})
  const [currentWinners, setCurrentWinners] = useState<Record<string, AwardInfo>>({})
  const [loading, setLoading] = useState(true)
  const [announcing, setAnnouncing] = useState<string | null>(null)

  useEffect(() => {
    fetchSeasons()
  }, [])

  async function fetchSeasons() {
    const res = await fetch("/api/seasons")
    const data = await res.json()
    setSeasons(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function fetchVotesForSeason(seasonId: string) {
    if (seasonVotes[seasonId]) return
    const [votesRes, awardsRes] = await Promise.all([
      fetch(`/api/player-of-season?seasonId=${seasonId}`),
      fetch(`/api/awards?seasonId=${seasonId}`),
    ])
    if (!votesRes.ok) return
    const votes = await votesRes.json()
    setSeasonVotes(prev => ({
      ...prev,
      [seasonId]: { nominees: votes.nominees, totalVotes: votes.totalVotes, recentVotes: votes.recentVotes || [] },
    }))
    if (awardsRes.ok) {
      const awards = await awardsRes.json()
      const winner = (Array.isArray(awards) ? awards : []).find((a: AwardInfo) => a.category === "player_of_season")
      if (winner) {
        setCurrentWinners(prev => ({ ...prev, [seasonId]: winner }))
      }
    }
  }

  async function announceWinner(seasonId: string, playerId: string) {
    setAnnouncing(`${seasonId}:${playerId}`)
    try {
      const res = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId, category: "player_of_season", playerId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Failed to announce winner")
        return
      }
      const award = await res.json()
      setCurrentWinners(prev => ({ ...prev, [seasonId]: { ...award, playerId } }))
    } catch {
      alert("Network error. Try again.")
    } finally {
      setAnnouncing(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Trophy className="h-7 w-7 text-[var(--accent)]" />
        Player of the Season Voting
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        View vote breakdowns per season and announce the Player of the Season
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : seasons.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
          No seasons found
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map(s => {
            const sv = seasonVotes[s.id]
            const winner = currentWinners[s.id]
            const topPlayer = sv && sv.nominees.length > 0
              ? [...sv.nominees].sort((a, b) => b.votes - a.votes)[0]
              : null

            return (
              <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <button
                  onClick={() => fetchVotesForSeason(s.id)}
                  className="flex w-full items-center gap-4 p-4 text-left"
                >
                  <div>
                    <p className="font-semibold">{s.name} ({s.year})</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {sv ? `${sv.totalVotes} total votes` : "Click to load votes"}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {winner && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        <Crown className="h-3 w-3" /> {winner.player?.name || "Winner"}
                      </span>
                    )}
                    {sv && (
                      <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Vote className="h-3 w-3" /> {sv.totalVotes}
                      </span>
                    )}
                  </div>
                </button>

                {sv && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                    {sv.nominees.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">No votes yet</p>
                    ) : (
                      <>
                        <div className="mb-4 space-y-2">
                          {[...sv.nominees]
                            .sort((a, b) => b.votes - a.votes || b.impact - a.impact)
                            .map((p, i) => {
                              const pct = sv.totalVotes > 0 ? (p.votes / sv.totalVotes) * 100 : 0
                              const isWinner = winner?.playerId === p.id
                              return (
                                <div key={p.id} className="flex items-center gap-3">
                                  <span className="w-5 text-center text-xs font-bold text-[var(--muted-foreground)]">
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center justify-between">
                                      <span className={`flex items-center gap-1 text-sm font-medium ${isWinner ? "text-[var(--accent)]" : ""}`}>
                                        {p.name}
                                        <span className="text-xs text-[var(--muted-foreground)]">
                                          ({p.runs} runs · {p.wickets} wkts · {p.innings} inns)
                                        </span>
                                        {isWinner && <Crown className="h-3 w-3" />}
                                      </span>
                                      <span className="text-xs text-[var(--muted-foreground)]">
                                        {p.votes} vote{p.votes !== 1 ? "s" : ""} ({pct.toFixed(0)}%)
                                      </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                                      <div
                                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>

                        {topPlayer && topPlayer.votes > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <p className="mb-1 w-full text-xs font-medium text-[var(--muted-foreground)]">
                              Announce Player of the Season:
                            </p>
                            {[...sv.nominees]
                              .filter(p => p.votes > 0)
                              .sort((a, b) => b.votes - a.votes)
                              .map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => announceWinner(s.id, p.id)}
                                  disabled={announcing === `${s.id}:${p.id}` || !!winner}
                                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    winner?.playerId === p.id
                                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                      : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-50"
                                  }`}
                                >
                                  {announcing === `${s.id}:${p.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : winner?.playerId === p.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Crown className="h-3 w-3" />
                                  )}
                                  {p.name} ({p.votes})
                                </button>
                              ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span>Total: {sv.totalVotes} votes</span>
                          {topPlayer && topPlayer.votes > 0 && (
                            <>
                              <span>·</span>
                              <span>Top: {topPlayer.name}</span>
                            </>
                          )}
                        </div>

                        {sv.recentVotes.length > 0 && (
                          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)]/50 p-3">
                            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                              <Clock className="h-3 w-3" /> Recent votes ({sv.recentVotes.length})
                            </p>
                            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                              {sv.recentVotes.map((v, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="truncate min-w-0">
                                    <strong>{v.name}</strong>
                                    <span className="text-[var(--muted-foreground)]"> voted for {v.playerName}</span>
                                  </span>
                                  <span className="shrink-0 text-[var(--muted-foreground)]">{formatDateTimePKT(v.createdAt)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
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
