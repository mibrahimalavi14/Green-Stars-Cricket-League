"use client"

import { useState, useEffect } from "react"
import { Star, Trophy, Loader2, Medal, Vote, Check } from "lucide-react"

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

interface PlayerVote {
  id: string
  name: string
  role: string
  photo: string
  teamId: string
  votes: number
}

interface MatchVotes {
  match: MatchData
  players: PlayerVote[]
  totalVotes: number
}

export default function AdminPotmPage() {
  const [matches, setMatches] = useState<MatchData[]>([])
  const [matchVotes, setMatchVotes] = useState<Record<string, MatchVotes>>({})
  const [loading, setLoading] = useState(true)
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)
  const [settingMotm, setSettingMotm] = useState<string | null>(null)

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

  async function fetchVotesForMatch(matchId: string) {
    if (matchVotes[matchId]) return
    const res = await fetch(`/api/potm?matchId=${matchId}`)
    if (!res.ok) return
    const data = await res.json()
    setMatchVotes(prev => ({
      ...prev,
      [matchId]: {
        match: data.match,
        players: data.players,
        totalVotes: data.totalVotes,
      },
    }))
  }

  async function toggleExpand(matchId: string) {
    if (expandedMatch === matchId) {
      setExpandedMatch(null)
      return
    }
    setExpandedMatch(matchId)
    await fetchVotesForMatch(matchId)
  }

  async function setOfficialMotm(matchId: string, playerName: string) {
    setSettingMotm(matchId)
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: matchId, manOfMatch: playerName }),
    })
    setMatches(prev =>
      prev.map(m => (m.id === matchId ? { ...m, manOfMatch: playerName } : m))
    )
    setSettingMotm(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Star className="h-7 w-7 text-[var(--accent)]" />
        POTM Voting Admin
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">View vote breakdowns and set official Man of the Match</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
          No completed matches yet
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => {
            const isExpanded = expandedMatch === m.id
            const mv = matchVotes[m.id]
            const topPlayer = mv && mv.players.length > 0
              ? [...mv.players].sort((a, b) => b.votes - a.votes)[0]
              : null

            return (
              <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <button
                  onClick={() => toggleExpand(m.id)}
                  className="flex w-full items-center gap-4 p-4 text-left"
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
                    {m.manOfMatch && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        <Trophy className="h-3 w-3" /> {m.manOfMatch}
                      </span>
                    )}
                    {mv && (
                      <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Vote className="h-3 w-3" /> {mv.totalVotes}
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                    {m.result && (
                      <p className="mb-3 text-sm text-green-500 font-medium">{m.result}</p>
                    )}

                    {!mv ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : mv.players.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">No votes yet</p>
                    ) : (
                      <>
                        <div className="mb-4 space-y-2">
                          {[...mv.players]
                            .sort((a, b) => b.votes - a.votes)
                            .map((p, i) => {
                              const pct = mv.totalVotes > 0 ? (p.votes / mv.totalVotes) * 100 : 0
                              const isCurrentMotm = m.manOfMatch === p.name
                              return (
                                <div key={p.id} className="flex items-center gap-3">
                                  <span className="w-5 text-center text-xs font-bold text-[var(--muted-foreground)]">
                                    {i + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center justify-between">
                                      <span className={`flex items-center gap-1 text-sm font-medium ${isCurrentMotm ? "text-[var(--accent)]" : ""}`}>
                                        {p.name}
                                        {isCurrentMotm && <Trophy className="h-3 w-3" />}
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
                            <p className="w-full text-xs font-medium text-[var(--muted-foreground)] mb-1">Set Official MOTM:</p>
                            {[...mv.players]
                              .filter(p => p.votes > 0)
                              .sort((a, b) => b.votes - a.votes)
                              .map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => setOfficialMotm(m.id, p.name)}
                                  disabled={settingMotm === m.id}
                                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    m.manOfMatch === p.name
                                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                      : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                                  }`}
                                >
                                  {settingMotm === m.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : m.manOfMatch === p.name ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Medal className="h-3 w-3" />
                                  )}
                                  {p.name} ({p.votes})
                                </button>
                              ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span>Total: {mv.totalVotes} votes</span>
                          {topPlayer && topPlayer.votes > 0 && (
                            <>
                              <span>·</span>
                              <span>Top: {topPlayer.name}</span>
                            </>
                          )}
                        </div>
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
