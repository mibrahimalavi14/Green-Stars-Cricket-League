"use client"

import { useState, useEffect } from "react"
import { Sword, Trophy, BarChart3, Calendar, Search, CheckCircle2, XCircle } from "lucide-react"

type Team = { id: string; name: string; shortName: string; logo: string; color: string }
type Match = {
  id: string; date: string; venue: string; result: string
  team1Score: string; team2Score: string
  team1: Team; team2: Team; team1Id: string; team2Id: string
}
type H2HData = {
  team1: Team; team2: Team; matches: Match[]
  team1Wins: number; team2Wins: number; totalMatches: number
  team1Highest: number; team2Highest: number
}

export default function HeadToHeadPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [team1Id, setTeam1Id] = useState("")
  const [team2Id, setTeam2Id] = useState("")
  const [data, setData] = useState<H2HData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/teams").then(r => r.json()).then(setTeams)
  }, [])

  useEffect(() => {
    if (!team1Id || !team2Id || team1Id === team2Id) { setData(null); return }
    setLoading(true)
    fetch(`/api/head-to-head?team1Id=${team1Id}&team2Id=${team2Id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [team1Id, team2Id])

  const swap = () => { setTeam1Id(team2Id); setTeam2Id(team1Id) }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <Sword className="h-7 w-7 text-[var(--accent)]" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Head to Head</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Compare historical matchups between two teams</p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Team A</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <select
              value={team1Id} onChange={e => setTeam1Id(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Select team...</option>
              {teams.filter(t => t.id !== team2Id).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={swap} className="flex h-10 w-10 items-center justify-center self-end rounded-full border border-[var(--border)] bg-[var(--muted)] transition-colors hover:bg-[var(--accent)]/20">
          <span className="text-lg">⇄</span>
        </button>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Team B</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <select
              value={team2Id} onChange={e => setTeam2Id(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Select team...</option>
              {teams.filter(t => t.id !== team1Id).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {team1Id && team2Id && team1Id === team2Id && (
        <p className="text-center text-sm text-red-500">Please select two different teams</p>
      )}

      {loading && (
        <div className="py-20 text-center text-[var(--muted-foreground)]">Loading stats...</div>
      )}

      {data && !loading && data.totalMatches === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-24 text-center">
          <p className="text-lg text-[var(--muted-foreground)]">No completed matches found</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]/60">{data.team1.name} vs {data.team2.name} have not played each other yet</p>
        </div>
      )}

      {data && !loading && data.totalMatches > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
              <BarChart3 className="mx-auto mb-2 h-5 w-5 text-[var(--muted-foreground)]" />
              <p className="text-3xl font-bold">{data.totalMatches}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Total Matches</p>
            </div>
            <div className="rounded-xl border-2 p-5 text-center" style={{ borderColor: data.team1.color + "60", backgroundColor: data.team1.color + "10" }}>
              <Trophy className="mx-auto mb-2 h-5 w-5" style={{ color: data.team1.color }} />
              <p className="text-3xl font-bold">{data.team1Wins}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{data.team1.shortName} Wins</p>
            </div>
            <div className="rounded-xl border-2 p-5 text-center" style={{ borderColor: data.team2.color + "60", backgroundColor: data.team2.color + "10" }}>
              <Trophy className="mx-auto mb-2 h-5 w-5" style={{ color: data.team2.color }} />
              <p className="text-3xl font-bold">{data.team2Wins}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{data.team2.shortName} Wins</p>
            </div>
          </div>

          {/* Win Bar */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="mb-4 text-center text-sm font-semibold text-[var(--muted-foreground)]">WIN COMPARISON</h3>
            <div className="flex items-center gap-3">
              <span className="w-12 text-right text-sm font-bold" style={{ color: data.team1.color }}>{Math.round((data.team1Wins / data.totalMatches) * 100)}%</span>
              <div className="flex h-4 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(data.team1Wins / data.totalMatches) * 100}%`, backgroundColor: data.team1.color }} />
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(data.team2Wins / data.totalMatches) * 100}%`, backgroundColor: data.team2.color }} />
              </div>
              <span className="w-12 text-sm font-bold" style={{ color: data.team2.color }}>{Math.round((data.team2Wins / data.totalMatches) * 100)}%</span>
            </div>
            <div className="mt-3 flex justify-between text-xs text-[var(--muted-foreground)]">
              <span className="font-medium" style={{ color: data.team1.color }}>{data.team1.name}</span>
              <span className="font-medium" style={{ color: data.team2.color }}>{data.team2.name}</span>
            </div>
          </div>

          {/* Highest Scores */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Highest Score — {data.team1.shortName}</p>
              <p className="text-3xl font-bold" style={{ color: data.team1.color }}>{data.team1Highest}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Highest Score — {data.team2.shortName}</p>
              <p className="text-3xl font-bold" style={{ color: data.team2.color }}>{data.team2Highest}</p>
            </div>
          </div>

          {/* Match List */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h3 className="text-sm font-semibold">Match History</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {data.matches.map(m => {
                const t1IsA = m.team1Id === data.team1.id
                const aWon = m.result.includes(data.team1.name)
                return (
                  <div key={m.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      {aWon ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          <span style={{ color: data.team1.color }}>{data.team1.shortName}</span>
                          {" "}{m.team1Score} {" — "}
                          <span style={{ color: data.team2.color }}>{data.team2.shortName}</span>
                          {" "}{m.team2Score}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">{m.result}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.date).toLocaleDateString()}</span>
                      <span>{m.venue}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {!team1Id && !team2Id && !data && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-24 text-center">
          <Sword className="mx-auto mb-4 h-10 w-10 text-[var(--muted-foreground)]/40" />
          <p className="text-lg text-[var(--muted-foreground)]">Select two teams to compare</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]/60">Choose from the dropdowns above to see head-to-head stats</p>
        </div>
      )}
    </div>
  )
}
