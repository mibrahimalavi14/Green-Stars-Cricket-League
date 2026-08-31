"use client"

import { useState, useEffect } from "react"
import { Trophy, Loader2, Crown } from "lucide-react"

interface SeasonData {
  id: string
  name: string
  year: number
}

interface Nominee {
  id: string
  name: string
  role: string
  teamName: string
  runs: number
  wickets: number
  catches: number
  innings: number
  impact: number
}

interface SeasonResult {
  nominees: Nominee[]
  winners: Nominee[]
}

export default function AdminPlayerOfSeasonPage() {
  const [seasons, setSeasons] = useState<SeasonData[]>([])
  const [results, setResults] = useState<Record<string, SeasonResult>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSeasons()
  }, [])

  async function fetchSeasons() {
    const res = await fetch("/api/seasons")
    const data = await res.json()
    setSeasons(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function fetchResult(seasonId: string) {
    if (results[seasonId]) return
    const res = await fetch(`/api/player-of-season?seasonId=${seasonId}`)
    if (!res.ok) return
    const data = await res.json()
    setResults(prev => ({
      ...prev,
      [seasonId]: { nominees: data.nominees || [], winners: data.winners || [] },
    }))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Trophy className="h-7 w-7 text-[var(--accent)]" />
        Player of the Season (Auto)
      </h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        Auto-calculated Player of the Season per season by performance impact
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
            const r = results[s.id]
            const winner = r?.winners[0]
            return (
              <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <button
                  onClick={() => fetchResult(s.id)}
                  className="flex w-full items-center gap-4 p-4 text-left"
                >
                  <div>
                    <p className="font-semibold">{s.name} ({s.year})</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {r ? `${r.nominees.length} performers` : "Click to load results"}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {winner && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        <Crown className="h-3 w-3" /> {winner.name}
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)]">{r ? "▼" : ""}</span>
                  </div>
                </button>

                {r && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                    {r.nominees.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">No completed matches yet</p>
                    ) : (
                      <>
                        {winner && (
                          <div className="mb-4 flex items-center gap-3 rounded-lg bg-[var(--accent)]/5 p-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15">
                              <Crown className="h-5 w-5 text-[var(--accent)]" />
                            </span>
                            <div>
                              <p className="font-semibold">{winner.name}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                Player of the Season · Impact {winner.impact}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {[...r.nominees]
                            .sort((a, b) => b.impact - a.impact)
                            .map((p, i) => {
                              const isWinner = winner?.id === p.id
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
                                        Impact {p.impact}
                                      </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                                      <div
                                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                                        style={{ width: `${(p.impact / (r.nominees[0]?.impact || 1)) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
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
