"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trophy, Shield, Target, Activity, RotateCcw, Loader2, CheckCircle, Map, ChevronDown, ChevronUp, Eye } from "lucide-react"
import { PartnershipCard } from "@/components/PartnershipCard"

interface BallEvent {
  runs: number
  extras: string | null
  wicket: string | null
  bowler: string
  striker: string
  nonStriker: string
  wicketBatsman: string | null
  wicketFielder: string | null
  isWide: boolean
  isNoBall: boolean
  byes: number
  legByes: number
  region: string
}

interface Team {
  id: string
  name: string
  shortName: string
  logo: string
  color: string
}

interface Player {
  id: string
  name: string
  role: string
  teamId: string
}

interface InningsData {
  id: string
  matchId: string
  teamId: string
  runs: number
  wickets: number
  balls: number
  extras: number
  ballsData: string
}

interface MatchResult {
  id: string
  matchNo: number
  date: string
  venue: string
  stage: string
  status: string
  result: string
  team1Score: string
  team2Score: string
  tossWinner: string
  tossDecision: string
  team1: Team
  team2: Team
  innings: InningsData[]
}

interface PlayerMatch {
  playerId: string
  player: Player
  teamId: string
  battingRuns: number
  ballsFaced: number
  fours: number
  sixes: number
  ones: number
  twos: number
  threes: number
  dotBalls: number
  isOut: boolean
  dismissalType: string
  dismissedByBowlerId: string
  dismissedByFielderId: string
  bowlingWickets: number
  bowlingRuns: number
  ballsBowled: number
  maidens: number
  wides: number
  noBalls: number
  hattricks: number
  catches: number
  stumpings: number
  runOuts: number
}

function ballDisplay(ball: BallEvent): { text: string; color: string; region: string } {
  const region = ball.region || ""
  if (ball.wicket) return { text: "W", color: "bg-purple-600 text-white", region }
  if (ball.isWide) return { text: "Wd", color: "bg-gray-500 text-white", region }
  if (ball.isNoBall) return { text: "Nb", color: "bg-gray-500 text-white", region }
  if (ball.byes > 0) return { text: `${ball.byes}B`, color: "bg-gray-500 text-white", region }
  if (ball.legByes > 0) return { text: `${ball.legByes}LB`, color: "bg-gray-500 text-white", region }
  const r = ball.runs
  if (r === 0) return { text: "0", color: "bg-[var(--muted)]", region }
  if (r === 1) return { text: "1", color: "bg-blue-500 text-white", region }
  if (r === 2) return { text: "2", color: "bg-yellow-500 text-white", region }
  if (r === 3) return { text: "3", color: "bg-orange-500 text-white", region }
  if (r === 4) return { text: "4", color: "bg-pink-500 text-white", region }
  if (r === 6) return { text: "6", color: "bg-red-500 text-white", region }
  return { text: String(r), color: "bg-[var(--muted)]", region }
}

function formatOvers(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`
}

function Scorecard({ match, players, performances, onGenerate }: { match: MatchResult; players: Player[]; performances: PlayerMatch[]; onGenerate: () => void }) {
  const [expandedInnings, setExpandedInnings] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const team1Players = players.filter((p) => p.teamId === match.team1.id)
  const team2Players = players.filter((p) => p.teamId === match.team2.id)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {match.stage !== "league" ? match.stage.toUpperCase() : `Match ${match.matchNo}`} &middot; {new Date(match.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">{match.venue}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setGenerating(true)
                await fetch("/api/live/sync-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.id }) })
                await fetch("/api/matches", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: match.id, status: "completed" }) })
                setGenerating(false)
                onGenerate()
              }}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
              {generating ? "Generating..." : "Generate Stats"}
            </button>
            <button
              onClick={() => router.push(`/matches/${match.id}`)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
            >
              <Eye className="h-3 w-3" /> View
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 items-center gap-4 text-center sm:grid-cols-3">
          <div>
            <div className="flex items-center justify-center gap-2">
              {match.team1.logo && <img src={match.team1.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
              <p className="font-bold">{match.team1.shortName}</p>
            </div>
            <p className="mt-1 text-2xl font-black">{match.team1Score || "-"}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent)]">VS</p>
            {match.tossWinner && (
              <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                Toss: {match.tossWinner === match.team1.id ? match.team1.shortName : match.team2.shortName} ({match.tossDecision})
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <p className="font-bold">{match.team2.shortName}</p>
              {match.team2.logo && <img src={match.team2.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
            </div>
            <p className="mt-1 text-2xl font-black">{match.team2Score || "-"}</p>
          </div>
        </div>
        {match.result && <p className="mt-2 text-center text-sm font-medium text-[var(--accent)]">{match.result}</p>}
      </div>

      {match.innings.map((inn) => {
        const balls: BallEvent[] = (() => { try { const p = JSON.parse(inn.ballsData || "[]"); return Array.isArray(p) ? p : [] } catch { return [] } })()
        const isExpanded = expandedInnings === inn.id
        const battingTeam = inn.teamId === match.team1.id ? match.team1 : match.team2
        const bowlingTeam = inn.teamId === match.team1.id ? match.team2 : match.team1
        const battingPlayersList = inn.teamId === match.team1.id ? team1Players : team2Players
        const bowlingPlayersList = inn.teamId === match.team1.id ? team2Players : team1Players

        const battingStats: Record<string, any> = {}
        const bowlingStats: Record<string, any> = {}
        const fieldingStats: Record<string, any> = {}

        for (const ball of balls) {
          if (!battingStats[ball.striker]) battingStats[ball.striker] = { runs: 0, balls: 0, fours: 0, sixes: 0, ones: 0, twos: 0, dots: 0, isOut: false, dismissal: "" }
          const bs = battingStats[ball.striker]
          bs.runs += ball.runs
          if (!ball.isWide && !ball.isNoBall) bs.balls++
          if (ball.runs === 4) bs.fours++
          if (ball.runs === 6) bs.sixes++
          if (ball.runs === 1) bs.ones++
          if (ball.runs === 2) bs.twos++
          if (ball.runs === 0 && !ball.isWide && !ball.isNoBall && !ball.wicket) bs.dots++

          if (!bowlingStats[ball.bowler]) bowlingStats[ball.bowler] = { runs: 0, balls: 0, wickets: 0, wides: 0, noBalls: 0, fours: 0, sixes: 0 }
          const bws = bowlingStats[ball.bowler]
          bws.runs += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
          if (!ball.isWide && !ball.isNoBall) bws.balls++
          if (ball.isWide) bws.wides++
          if (ball.isNoBall) bws.noBalls++
          if (ball.wicket) bws.wickets++

          if (ball.wicket) {
            const dismissed = ball.wicketBatsman || ball.striker
            if (battingStats[dismissed]) battingStats[dismissed].isOut = true
            if (battingStats[dismissed]) battingStats[dismissed].dismissal = ball.wicket
            if (ball.wicketFielder) {
              if (!fieldingStats[ball.wicketFielder]) fieldingStats[ball.wicketFielder] = { catches: 0, stumpings: 0, runOuts: 0 }
              if (ball.wicket === "caught") fieldingStats[ball.wicketFielder].catches++
              if (ball.wicket === "stumped") fieldingStats[ball.wicketFielder].stumpings++
              if (ball.wicket === "runout") fieldingStats[ball.wicketFielder].runOuts++
            }
          }
        }

        return (
          <div key={inn.id} className="border-b border-[var(--border)]">
            <button
              onClick={() => setExpandedInnings(isExpanded ? null : inn.id)}
              className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[var(--muted)]/30"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-semibold">{battingTeam.shortName} Innings</span>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {inn.runs + inn.extras}/{inn.wickets} ({formatOvers(inn.balls)} ov)
                </span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isExpanded && (
              <div className="space-y-4 p-4 pt-0">
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="rounded-lg bg-[var(--muted)] p-2"><p className="text-[var(--muted-foreground)]">Runs</p><p className="text-lg font-bold">{inn.runs + inn.extras}</p></div>
                  <div className="rounded-lg bg-[var(--muted)] p-2"><p className="text-[var(--muted-foreground)]">Wickets</p><p className="text-lg font-bold">{inn.wickets}</p></div>
                  <div className="rounded-lg bg-[var(--muted)] p-2"><p className="text-[var(--muted-foreground)]">Overs</p><p className="text-lg font-bold">{formatOvers(inn.balls)}</p></div>
                  <div className="rounded-lg bg-[var(--muted)] p-2"><p className="text-[var(--muted-foreground)]">Extras</p><p className="text-lg font-bold">{inn.extras}</p></div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--muted-foreground)]">Batting</p>
                  <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]"><th className="p-2 text-left">Batsman</th><th className="p-2 text-center">R</th><th className="p-2 text-center">B</th><th className="p-2 text-center">1s</th><th className="p-2 text-center">2s</th><th className="p-2 text-center">4s</th><th className="p-2 text-center">6s</th><th className="p-2 text-center">SR</th><th className="p-2 text-center">Dismissal</th></tr></thead>
                      <tbody>
                        {battingPlayersList.map((p) => {
                          const s = battingStats[p.id]
                          if (!s) return null
                          const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "0.0"
                          return <tr key={p.id} className="border-b border-[var(--border)]"><td className="p-2 font-medium">{p.name}{s.isOut ? "" : "*"}</td><td className="p-2 text-center font-bold">{s.runs}</td><td className="p-2 text-center">{s.balls}</td><td className="p-2 text-center text-blue-400">{s.ones}</td><td className="p-2 text-center text-yellow-400">{s.twos}</td><td className="p-2 text-center text-pink-500">{s.fours}</td><td className="p-2 text-center text-red-500">{s.sixes}</td><td className="p-2 text-center">{sr}</td><td className="p-2 text-center text-purple-500">{s.isOut ? s.dismissal : "Not Out"}</td></tr>
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--muted-foreground)]">Bowling</p>
                  <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]"><th className="p-2 text-left">Bowler</th><th className="p-2 text-center">O</th><th className="p-2 text-center">R</th><th className="p-2 text-center">W</th><th className="p-2 text-center">Econ</th><th className="p-2 text-center">Wd</th><th className="p-2 text-center">Nb</th></tr></thead>
                      <tbody>
                        {bowlingPlayersList.map((p) => {
                          const s = bowlingStats[p.id]
                          if (!s) return null
                          const econ = s.balls > 0 ? ((s.runs / s.balls) * 6).toFixed(1) : "0.0"
                          return <tr key={p.id} className="border-b border-[var(--border)]"><td className="p-2 font-medium">{p.name}</td><td className="p-2 text-center">{formatOvers(s.balls)}</td><td className="p-2 text-center">{s.runs}</td><td className="p-2 text-center font-bold text-purple-500">{s.wickets}</td><td className="p-2 text-center">{econ}</td><td className="p-2 text-center text-[var(--muted-foreground)]">{s.wides}</td><td className="p-2 text-center text-[var(--muted-foreground)]">{s.noBalls}</td></tr>
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {Object.keys(fieldingStats).length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--muted-foreground)]">Fielding</p>
                    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)]"><th className="p-2 text-left">Fielder</th><th className="p-2 text-center">Ct</th><th className="p-2 text-center">St</th><th className="p-2 text-center">RO</th></tr></thead>
                        <tbody>
                          {Object.entries(fieldingStats).map(([pid, fs]: [string, any]) => {
                            const player = [...team1Players, ...team2Players].find((pp) => pp.id === pid)
                            return <tr key={pid} className="border-b border-[var(--border)]"><td className="p-2 font-medium">{player?.name || pid}</td><td className="p-2 text-center">{fs.catches}</td><td className="p-2 text-center">{fs.stumpings}</td><td className="p-2 text-center">{fs.runOuts}</td></tr>
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {balls.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-[var(--muted-foreground)]">Ball-by-Ball</p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        let legalCount = 0
                        let currentOver = 0
                        const groups: { over: number; balls: BallEvent[] }[] = []
                        let currentGroup: BallEvent[] = []
                        for (const ball of balls) {
                          const isLegal = !ball.isWide && !ball.isNoBall
                          if (isLegal && legalCount > 0 && legalCount % 6 === 0) {
                            groups.push({ over: currentOver, balls: currentGroup })
                            currentGroup = []
                            currentOver++
                          }
                          if (isLegal) legalCount++
                          currentGroup.push(ball)
                        }
                        if (currentGroup.length > 0) groups.push({ over: currentOver, balls: currentGroup })
                        return groups.map((g) => (
                          <div key={g.over} className="mb-1">
                            <p className="text-[10px] text-[var(--muted-foreground)]">Over {g.over + 1}</p>
                            <div className="flex flex-wrap gap-1">
                              {g.balls.map((b, i) => {
                                const d = ballDisplay(b)
                                return (
                                  <div key={i} className="flex flex-col items-center">
                                    <span title={d.region || ""} className={`flex h-7 w-7 items-center justify-center rounded text-[10px] font-bold ${d.color}`}>{d.text}</span>
                                    {d.region && <span className="mt-0.5 text-[7px] text-green-600 font-medium leading-none">{d.region}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                )}

                {balls.length > 0 && (
                  <PartnershipCard
                    ballsData={balls}
                    battingPlayers={battingPlayersList}
                    battingTeam={battingTeam}
                    inning={inn}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AdminScorecardPage() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [performances, setPerformances] = useState<PlayerMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  async function loadData() {
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/matches?status=completed"),
        fetch("/api/players"),
      ])
      if (mRes.ok) {
        const data = await mRes.json()
        const completedMatches = data.filter((m: any) => m.status === "completed" || m.status === "live")
        setMatches(completedMatches)
        if (completedMatches.length > 0 && !selectedMatch) setSelectedMatch(completedMatches[0].id)
      }
      if (pRes.ok) setPlayers(await pRes.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [refreshKey])

  const match = matches.find((m) => m.id === selectedMatch)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Trophy className="h-6 w-6 text-[var(--accent)]" /> Match Scorecards
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Read-only detailed view of all live scoring data. Generate stats to update player records.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--muted)] px-3 py-2 text-sm hover:bg-[var(--muted)]/80"
        >
          <RotateCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {matches.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMatch(m.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                selectedMatch === m.id
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]"
              }`}
            >
              {m.team1.shortName} vs {m.team2.shortName}
              <span className="ml-1 opacity-60">{new Date(m.date).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>
      ) : match ? (
        <Scorecard key={match.id} match={match} players={players} performances={performances} onGenerate={() => setRefreshKey((k) => k + 1)} />
      ) : (
        <div className="py-12 text-center text-[var(--muted-foreground)]">
          <p>No completed matches found.</p>
          <p className="mt-1 text-sm">Complete a match through live scoring first.</p>
        </div>
      )}
    </div>
  )
}
