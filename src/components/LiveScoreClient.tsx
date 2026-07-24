"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { getVenueMapsUrl } from "@/lib/utils"
import { PartnershipCard } from "./PartnershipCard"
import { MATCH_CONFIG, formatOvers } from "@/lib/config"

interface LiveMatch {
  id: string
  team1: { id: string; name: string; shortName: string; logo: string; color: string }
  team2: { id: string; name: string; shortName: string; logo: string; color: string }
  team1Score: string
  team2Score: string
  status: string
  result: string
  venue: string
  tossWinner: string
  tossDecision: string
  inningsBreak: boolean
  innings: { id: string; teamId: string; runs: number; wickets: number; balls: number; extras: number; ballsData: string }[]
  team1Players: { id: string; name: string }[]
  team2Players: { id: string; name: string }[]
}

interface UpcomingMatch {
  id: string
  matchNo: number
  team1: { name: string; shortName: string; logo: string; color: string }
  team2: { name: string; shortName: string; logo: string; color: string }
  date: string
  venue: string
}

interface BallEvent {
  runs?: number
  extras?: string | null
  wicket?: string | null
  bowler?: string
  striker?: string
  nonStriker?: string
  wicketBatsman?: string | null
  wicketFielder?: string | null
  isWide?: boolean
  isNoBall?: boolean
  byes?: number
  legByes?: number
  region?: string
}

interface TeamFormResult {
  matchId: string
  opponent: string
  opponentShort: string
  opponentLogo: string
  opponentColor: string
  won: boolean
  tie: boolean
  score: string
  opponentScore: string
  date: string
  venue: string
}

function parseBallsData(raw: string): BallEvent[] {
  try {
    return JSON.parse(raw || "[]") || []
  } catch {
    return []
  }
}

function getBallDisplay(ball: BallEvent): { text: string; color: string; region: string } {
  const region = ball.region || ""
  if (ball.wicket) return { text: "W", color: "bg-purple-600 text-white", region }
  if (ball.isWide) return { text: "Wd", color: "bg-gray-500 text-white", region }
  if (ball.isNoBall) return { text: "Nb", color: "bg-gray-500 text-white", region }
  if (ball.byes && ball.byes > 0) return { text: `${ball.byes}B`, color: "bg-gray-500 text-white", region }
  if (ball.legByes && ball.legByes > 0) return { text: `${ball.legByes}LB`, color: "bg-gray-500 text-white", region }
  const r = ball.runs || 0
  if (r === 0) return { text: "0", color: "bg-[var(--muted)]", region }
  if (r === 1) return { text: "1", color: "bg-blue-500 text-white", region }
  if (r === 2) return { text: "2", color: "bg-yellow-500 text-white", region }
  if (r === 3) return { text: "3", color: "bg-orange-500 text-white", region }
  if (r === 4) return { text: "4", color: "bg-pink-500 text-white", region }
  if (r === 6) return { text: "6", color: "bg-red-500 text-white", region }
  return { text: String(r), color: "bg-[var(--muted)]", region }
}

function getBallLabel(ball: BallEvent): string {
  if (ball.wicket) return `Wicket! (${ball.wicket})`
  if (ball.isWide) return "Wide"
  if (ball.isNoBall) return "No ball"
  if (ball.byes && ball.byes > 0) return `${ball.byes} bye${ball.byes > 1 ? "s" : ""}`
  if (ball.legByes && ball.legByes > 0) return `${ball.legByes} leg bye${ball.legByes > 1 ? "s" : ""}`
  const r = ball.runs || 0
  if (r === 0) return "Dot ball"
  if (r === 4) return "FOUR!"
  if (r === 6) return "SIX!"
  return `${r} run${r === 1 ? "" : "s"}`
}

function getDismissalText(ball: BallEvent, bowlingPlayers: { id: string; name: string }[]): string {
  const bowlerName = bowlingPlayers.find(p => p.id === ball.bowler)?.name || ""
  const fielderName = bowlingPlayers.find(p => p.id === ball.wicketFielder)?.name || ""
  const type = ball.wicket || ""
  if (type === "caught") return `c ${fielderName} b ${bowlerName}`
  if (type === "bowled") return `b ${bowlerName}`
  if (type === "lbw") return `lbw b ${bowlerName}`
  if (type === "stumped") return `st ${fielderName} b ${bowlerName}`
  if (type === "runout") return `run out (${fielderName})`
  if (type === "hit wicket") return `hit wicket b ${bowlerName}`
  if (type === "retired") return "retired"
  if (type === "obstructing") return "obstructing the field"
  return type
}

function computeInningsStats(
  balls: BallEvent[],
  battingPlayers: { id: string; name: string }[],
  bowlingPlayers: { id: string; name: string }[]
) {
  const batting: Record<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; dismissal: string }> = {}
  const bowling: Record<string, { runs: number; balls: number; wickets: number; wides: number; noBalls: number }> = {}

  for (const p of battingPlayers) {
    batting[p.id] = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "" }
  }

  for (const ball of balls) {
    const sid = ball.striker || ""
    if (sid && batting[sid]) {
      const bs = batting[sid]
      bs.runs += ball.runs || 0
      if (!ball.isWide && !ball.isNoBall) bs.balls++
      if (ball.runs === 4) bs.fours++
      if (ball.runs === 6) bs.sixes++
    }

    const bid = ball.bowler || ""
    if (bid) {
      if (!bowling[bid]) bowling[bid] = { runs: 0, balls: 0, wickets: 0, wides: 0, noBalls: 0 }
      const bws = bowling[bid]
      bws.runs += (ball.runs || 0) + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
      if (!ball.isWide && !ball.isNoBall) bws.balls++
      if (ball.isWide) bws.wides++
      if (ball.isNoBall) bws.noBalls++
      if (ball.wicket) bws.wickets++
    }

    if (ball.wicket) {
      const dismissed = ball.wicketBatsman || ball.striker || ""
      if (dismissed && batting[dismissed]) {
        batting[dismissed].isOut = true
        batting[dismissed].dismissal = getDismissalText(ball, bowlingPlayers)
      }
    }
  }

  return { batting, bowling }
}

function getCurrentOverBalls(balls: BallEvent[]): BallEvent[] {
  if (balls.length === 0) return []
  let legalCount = 0
  for (const b of balls) {
    if (!b.isWide && !b.isNoBall) legalCount++
  }
  const inLastOver = legalCount % 6 || 6
  let count = 0
  let startIdx = balls.length
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]
    const isLegal = !b.isWide && !b.isNoBall
    if (isLegal) count++
    if (count === inLastOver) {
      startIdx = i
      break
    }
  }
  return balls.slice(startIdx)
}

function getLastLegalBalls(balls: BallEvent[], count: number): BallEvent[] {
  const legal = balls.filter(b => !b.isWide && !b.isNoBall)
  return legal.slice(-count)
}

function computeOverScores(balls: BallEvent[]): number[] {
  const overs: number[] = []
  let runsThisOver = 0
  let legalCount = 0
  for (const b of balls) {
    const isLegal = !b.isWide && !b.isNoBall
    if (isLegal) {
      if (legalCount > 0 && legalCount % 6 === 0) {
        overs.push(runsThisOver)
        runsThisOver = 0
      }
      legalCount++
    }
    runsThisOver += b.runs || 0
    if (b.isWide) runsThisOver++
    if (b.isNoBall) runsThisOver++
  }
  if (legalCount > 0 && (legalCount - 1) % 6 !== 0 || overs.length === 0) {
    overs.push(runsThisOver)
  }
  return overs
}

function computeCumulativeScores(balls: BallEvent[]): number[] {
  const cumulative: number[] = []
  let total = 0
  let legalCount = 0
  for (const b of balls) {
    const isLegal = !b.isWide && !b.isNoBall
    if (isLegal) {
      if (legalCount > 0 && legalCount % 6 === 0) {
        cumulative.push(total)
      }
      legalCount++
    }
    total += b.runs || 0
    if (b.isWide) total++
    if (b.isNoBall) total++
  }
  if (cumulative.length === 0 || cumulative[cumulative.length - 1] !== total) {
    cumulative.push(total)
  }
  return cumulative
}

function computeMatchHighlights(
  inn1Balls: BallEvent[],
  inn2Balls: BallEvent[],
  batting1Players: { id: string; name: string }[],
  batting2Players: { id: string; name: string }[],
  bowling1Players: { id: string; name: string }[],
  bowling2Players: { id: string; name: string }[]
) {
  const highlights: { icon: string; text: string; sub: string }[] = []
  const allBalls = [...inn1Balls, ...inn2Balls]

  function bestBatting(balls: BallEvent[], players: { id: string; name: string }[]) {
    const stats: Record<string, { runs: number; balls: number }> = {}
    for (const b of balls) {
      const sid = b.striker || ""
      if (sid) {
        if (!stats[sid]) stats[sid] = { runs: 0, balls: 0 }
        stats[sid].runs += b.runs || 0
        if (!b.isWide && !b.isNoBall) stats[sid].balls++
      }
    }
    let best = { id: "", runs: 0, balls: 0 }
    for (const [id, s] of Object.entries(stats)) {
      if (s.runs > best.runs) best = { id, ...s }
    }
    if (best.runs > 0) {
      const name = players.find(p => p.id === best.id)?.name || "Unknown"
      return { name, runs: best.runs, balls: best.balls }
    }
    return null
  }

  function bestBowling(balls: BallEvent[], players: { id: string; name: string }[]) {
    const stats: Record<string, { runs: number; balls: number; wickets: number }> = {}
    for (const b of balls) {
      const bid = b.bowler || ""
      if (bid) {
        if (!stats[bid]) stats[bid] = { runs: 0, balls: 0, wickets: 0 }
        stats[bid].runs += (b.runs || 0) + (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0)
        if (!b.isWide && !b.isNoBall) stats[bid].balls++
        if (b.wicket) stats[bid].wickets++
      }
    }
    let best = { id: "", runs: 999, balls: 0, wickets: 0 }
    for (const [id, s] of Object.entries(stats)) {
      if (s.wickets > best.wickets || (s.wickets === best.wickets && s.runs < best.runs)) {
        best = { id, ...s }
      }
    }
    if (best.wickets > 0) {
      const name = players.find(p => p.id === best.id)?.name || "Unknown"
      return { name, wickets: best.wickets, runs: best.runs, balls: best.balls }
    }
    return null
  }

  function biggestSix(balls: BallEvent[], players: { id: string; name: string }[]) {
    for (const b of balls) {
      if (b.runs === 6 && b.region) {
        const name = players.find(p => p.id === b.striker)?.name
        if (name) return { name, region: b.region }
      }
    }
    return null
  }

  function mostProductiveOver(balls: BallEvent[]) {
    let bestOver = -1
    let bestRuns = 0
    let legalCount = 0
    let curRuns = 0
    let curLegal = 0
    let overStart = 0
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i]
      const isLegal = !b.isWide && !b.isNoBall
      if (isLegal) curLegal++
      curRuns += b.runs || 0
      if (b.isWide) curRuns++
      if (b.isNoBall) curRuns++
      if (isLegal && curLegal === 6) {
        if (curRuns > bestRuns) {
          bestRuns = curRuns
          bestOver = Math.floor(legalCount / 6)
        }
        legalCount += curLegal
        curRuns = 0
        curLegal = 0
      }
    }
    if (curRuns > bestRuns) bestRuns = curRuns
    return bestRuns > 0 ? { runs: bestRuns } : null
  }

  const bb1 = bestBatting(inn1Balls, batting1Players)
  const bb2 = bestBatting(inn2Balls, batting2Players)
  const bestBat = bb1 && bb2 ? (bb1.runs >= bb2.runs ? bb1 : bb2) : bb1 || bb2
  if (bestBat) highlights.push({ icon: "🏏", text: `${bestBat.name} — ${bestBat.runs}(${bestBat.balls})`, sub: "Top Scorer" })

  const bw1 = bestBowling(inn1Balls, bowling1Players)
  const bw2 = bestBowling(inn2Balls, bowling2Players)
  const bestBowl = bw1 && bw2 ? (bw1.wickets > bw2.wickets || (bw1.wickets === bw2.wickets && bw1.runs < bw2.runs) ? bw1 : bw2) : bw1 || bw2
  if (bestBowl) highlights.push({ icon: "🎯", text: `${bestBowl.name} — ${bestBowl.wickets}/${bestBowl.runs}`, sub: "Best Bowling" })

  const s1 = biggestSix(inn1Balls, batting1Players)
  const s2 = biggestSix(inn2Balls, batting2Players)
  const topSix = s1 || s2
  if (topSix) highlights.push({ icon: "💥", text: `${topSix.name} — ${topSix.region}`, sub: "Biggest Six" })

  const mp1 = mostProductiveOver(inn1Balls)
  const mp2 = mostProductiveOver(inn2Balls)
  const mp = mp1 && mp2 ? (mp1.runs > mp2.runs ? mp1 : mp2) : mp1 || mp2
  if (mp) highlights.push({ icon: "🔥", text: `${mp.runs} runs`, sub: "Best Over" })

  const totalFours = allBalls.filter(b => b.runs === 4).length
  const totalSixes = allBalls.filter(b => b.runs === 6).length
  if (totalFours + totalSixes > 0) highlights.push({ icon: "⚡", text: `${totalFours} fours, ${totalSixes} sixes`, sub: "Boundaries" })

  return highlights
}

function BattingScorecard({
  stats,
  players,
  battingTeam,
  currentStrikerId,
  currentNonStrikerId,
}: {
  stats: Record<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; dismissal: string }>
  players: { id: string; name: string }[]
  battingTeam: { name: string; shortName: string; logo: string }
  currentStrikerId?: string
  currentNonStrikerId?: string
}) {
  const activePlayers = players.filter((p) => stats[p.id])
  if (activePlayers.length === 0) return null

  const currentIds = new Set([currentStrikerId, currentNonStrikerId].filter(Boolean))
  const sorted = [...activePlayers].sort((a, b) => {
    const sa = stats[a.id], sb = stats[b.id]
    const aBatting = currentIds.has(a.id) && !sa.isOut
    const bBatting = currentIds.has(b.id) && !sb.isOut
    if (aBatting && !bBatting) return -1
    if (!aBatting && bBatting) return 1
    if (!sa.isOut && sa.balls === 0 && (sb.isOut || sb.balls > 0)) return -1
    if ((sa.isOut || sa.balls > 0) && !sb.isOut && sb.balls === 0) return 1
    if (sa.isOut && !sb.isOut) return 1
    if (!sa.isOut && sb.isOut) return -1
    return 0
  })

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center gap-2">
        {battingTeam.logo && <img src={battingTeam.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
        <h4 className="text-sm font-semibold">{battingTeam.shortName} Batting</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[420px] w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="pb-1.5 text-left font-medium">Batsman</th>
              <th className="pb-1.5 text-center font-medium">R</th>
              <th className="pb-1.5 text-center font-medium">B</th>
              <th className="pb-1.5 text-center font-medium">4s</th>
              <th className="pb-1.5 text-center font-medium">6s</th>
              <th className="pb-1.5 text-center font-medium">SR</th>
              <th className="pb-1.5 text-right font-medium">How Out</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const s = stats[p.id]
              if (!s) return null
              const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "0.0"
              const isStriker = p.id === currentStrikerId && !s.isOut
              const isNonStriker = p.id === currentNonStrikerId && !s.isOut
              return (
                <tr key={p.id} className={`border-b border-[var(--border)]/50 ${isStriker ? "bg-[var(--accent)]/10 font-bold" : isNonStriker ? "bg-green-500/5" : ""}`}>
                  <td className="py-1.5 font-medium">
                    {p.name}
                    {isStriker ? " *" : isNonStriker ? " •" : s.isOut ? " †" : ""}
                  </td>
                  <td className="py-1.5 text-center font-bold">{s.runs}</td>
                  <td className="py-1.5 text-center">{s.balls}</td>
                  <td className="py-1.5 text-center text-pink-500">{s.fours}</td>
                  <td className="py-1.5 text-center text-red-500">{s.sixes}</td>
                  <td className="py-1.5 text-center text-[var(--muted-foreground)]">{sr}</td>
                  <td className="py-1.5 text-right text-[10px] text-[var(--muted-foreground)] italic">{s.dismissal || ""}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BowlingScorecard({
  stats,
  players,
  bowlingTeam,
  currentBowlerId,
}: {
  stats: Record<string, { runs: number; balls: number; wickets: number; wides: number; noBalls: number }>
  players: { id: string; name: string }[]
  bowlingTeam: { name: string; shortName: string; logo: string }
  currentBowlerId?: string
}) {
  const activeBowlers = players.filter((p) => stats[p.id])
  if (activeBowlers.length === 0) return null

  const sorted = [...activeBowlers].sort((a, b) => {
    const sa = stats[a.id], sb = stats[b.id]
    const aCur = a.id === currentBowlerId
    const bCur = b.id === currentBowlerId
    if (aCur && !bCur) return -1
    if (!aCur && bCur) return 1
    return sb.wickets - sa.wickets || sa.balls - sb.balls
  })

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center gap-2">
        {bowlingTeam.logo && <img src={bowlingTeam.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
        <h4 className="text-sm font-semibold">{bowlingTeam.shortName} Bowling</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[350px] w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="pb-1.5 text-left font-medium">Bowler</th>
              <th className="pb-1.5 text-center font-medium">O</th>
              <th className="pb-1.5 text-center font-medium">R</th>
              <th className="pb-1.5 text-center font-medium">W</th>
              <th className="pb-1.5 text-center font-medium">Econ</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const s = stats[p.id]
              if (!s) return null
              const econ = s.balls > 0 ? ((s.runs / s.balls) * 6).toFixed(1) : "0.0"
              const isCurrent = p.id === currentBowlerId
              return (
                <tr key={p.id} className={`border-b border-[var(--border)]/50 ${isCurrent ? "bg-[var(--accent)]/10" : ""}`}>
                  <td className="py-1.5 font-medium">{p.name} {isCurrent ? " *" : ""}</td>
                  <td className="py-1.5 text-center">{formatOvers(s.balls)}</td>
                  <td className="py-1.5 text-center">{s.runs}</td>
                  <td className="py-1.5 text-center font-bold text-purple-500">{s.wickets}</td>
                  <td className="py-1.5 text-center text-[var(--muted-foreground)]">{econ}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
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
  const [teamForm, setTeamForm] = useState<Record<string, TeamFormResult[]>>({})
  const timelineRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const refreshScore = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch("/api/matches/live", { signal: ctrl.signal })
      if (res.ok) {
        const data = await res.json()
        setMatch(data)
      }
    } catch {}
    setRefreshing(false)
  }, [])

  useEffect(() => {
    const id = setInterval(refreshScore, 5000)
    const onVisChange = () => {
      if (document.hidden) {
        clearInterval(id)
      }
    }
    document.addEventListener("visibilitychange", onVisChange)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisChange)
      abortRef.current?.abort()
    }
  }, [refreshScore])

  useEffect(() => {
    if (!match) return
    const teamIds = [match.team1.id, match.team2.id]
    const cached = teamIds.filter(id => teamForm[id])
    if (cached.length === teamIds.length) return
    for (const teamId of teamIds) {
      if (teamForm[teamId]) continue
      fetch(`/api/matches`)
        .then(r => r.json())
        .then((data: any[]) => {
          const completed = data
            .filter((m: any) => m.status === "completed" && m.result && (m.team1Id === teamId || m.team2Id === teamId) && m.id !== match.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
          const results: TeamFormResult[] = completed.map((m: any) => {
            const isTeam1 = m.team1Id === teamId
            const opponent = isTeam1 ? m.team2 : m.team1
            const teamInn = m.innings?.find((i: any) => i.teamId === teamId)
            const oppInn = m.innings?.find((i: any) => i.teamId !== teamId)
            const teamTotal = teamInn ? teamInn.runs + teamInn.extras : 0
            const oppTotal = oppInn ? oppInn.runs + oppInn.extras : 0
            const won = m.winnerTeamId === teamId
            const tie = !m.winnerTeamId
            return {
              matchId: m.id,
              opponent: opponent.name,
              opponentShort: opponent.shortName,
              opponentLogo: opponent.logo || "",
              opponentColor: opponent.color || "#888",
              won,
              tie,
              score: teamTotal > 0 ? `${teamTotal}/${teamInn?.wickets ?? 0}` : "-",
              opponentScore: oppTotal > 0 ? `${oppTotal}/${oppInn?.wickets ?? 0}` : "-",
              date: m.date,
              venue: m.venue,
            }
          })
          setTeamForm(prev => ({ ...prev, [teamId]: results }))
        })
        .catch(() => {})
    }
  }, [match])

  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    if (!userScrolledUp.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [match])

  const handleTimelineScroll = useCallback(() => {
    const el = timelineRef.current
    if (!el) return
    userScrolledUp.current = el.scrollTop + el.clientHeight < el.scrollHeight - 50
  }, [])

  const inn1 = match?.innings.find((i) => i.teamId === match.team1.id) || null
  const inn2 = match?.innings.find((i) => i.teamId === match.team2.id) || null

  const inn1BallsParsed = useMemo(() => inn1 ? parseBallsData(inn1.ballsData) : [], [inn1?.ballsData])
  const inn2BallsParsed = useMemo(() => inn2 ? parseBallsData(inn2.ballsData) : [], [inn2?.ballsData])

  const inn1Stats = useMemo(() => inn1
    ? computeInningsStats(inn1BallsParsed, inn1.teamId === match!.team1.id ? match!.team1Players : match!.team2Players, inn1.teamId === match!.team1.id ? match!.team2Players : match!.team1Players)
    : { batting: {}, bowling: {} }, [inn1BallsParsed, inn1?.teamId, match])

  const inn2Stats = useMemo(() => inn2
    ? computeInningsStats(inn2BallsParsed, inn2.teamId === match!.team1.id ? match!.team1Players : match!.team2Players, inn2.teamId === match!.team1.id ? match!.team2Players : match!.team1Players)
    : { batting: {}, bowling: {} }, [inn2BallsParsed, inn2?.teamId, match])

  const currentInn = match?.innings.length ? match.innings[match.innings.length - 1] : null
  const allBallsParsed = useMemo(() => currentInn ? parseBallsData(currentInn.ballsData) : [], [currentInn?.ballsData])

  const overs1 = inn1 ? formatOvers(inn1.balls) : "0.0"
  const overs2 = inn2 ? formatOvers(inn2.balls) : "0.0"
  const t1Total = inn1 ? inn1.runs + inn1.extras : 0
  const t2Total = inn2 ? inn2.runs + inn2.extras : 0

  const currentBowlingTeam = currentInn ? (currentInn.teamId === match!.team1.id ? match!.team1 : match!.team2) : null
  const currentBattingTeam = currentInn ? (currentInn.teamId === match!.team1.id ? match!.team1 : match!.team2) : null
  const battingPlayers = currentInn ? (currentInn.teamId === match!.team1.id ? match!.team1Players : match!.team2Players) : []
  const bowlingPlayers = currentInn ? (currentInn.teamId === match!.team1.id ? match!.team2Players : match!.team1Players) : []

  const inn1Last = inn1BallsParsed.length > 0 ? inn1BallsParsed[inn1BallsParsed.length - 1] : null
  const inn2Last = inn2BallsParsed.length > 0 ? inn2BallsParsed[inn2BallsParsed.length - 1] : null

  const activeBatStats = currentInn ? (currentInn.teamId === match!.team1.id ? inn1Stats.batting : inn2Stats.batting) : {}
  const activeBowlStats = currentInn ? (currentInn.teamId === match!.team1.id ? inn1Stats.bowling : inn2Stats.bowling) : {}

  const lastBall = allBallsParsed.length > 0 ? allBallsParsed[allBallsParsed.length - 1] : null
  const currentStriker = lastBall?.striker ? battingPlayers.find((p) => p.id === lastBall.striker) : null
  const currentNonStriker = lastBall?.nonStriker ? battingPlayers.find((p) => p.id === lastBall.nonStriker) : null
  const currentBowler = lastBall?.bowler ? bowlingPlayers.find((p) => p.id === lastBall.bowler) : null

  const currentOverBalls = useMemo(() => getCurrentOverBalls(allBallsParsed), [allBallsParsed])

  const last6Balls = useMemo(() => getLastLegalBalls(allBallsParsed, 6), [allBallsParsed])

  const totalFours = useMemo(() => {
    const innBalls = currentInn ? allBallsParsed : []
    return innBalls.filter(b => b.runs === 4).length
  }, [allBallsParsed, currentInn])

  const totalSixes = useMemo(() => {
    const innBalls = currentInn ? allBallsParsed : []
    return innBalls.filter(b => b.runs === 6).length
  }, [allBallsParsed, currentInn])

  const winProbability = useMemo(() => {
    if (!currentInn || !inn1 || !inn2 || !match) return null
    const isSecondInn = match.innings.length === 2 && currentInn.teamId !== match.innings[0]?.teamId
    if (!isSecondInn) {
      const ballsFaced = currentInn.balls
      const projected = ballsFaced > 0 ? Math.round((t2Total / ballsFaced) * MATCH_CONFIG.totalBalls) : 0
      const strength = Math.min(100, Math.max(0, 50 + (projected - 30) * 1.5))
      return { team1: Math.round(strength), team2: Math.round(100 - strength) }
    }
    const target = inn1.runs + inn1.extras + 1
    const chasingTotal = currentInn.teamId === match.team1.id ? t1Total : t2Total
    const needed = target - chasingTotal
    const ballsLeft = MATCH_CONFIG.totalBalls - currentInn.balls
    const wktsLeft = MATCH_CONFIG.wicketsPerInnings - currentInn.wickets
    if (ballsLeft <= 0 || wktsLeft <= 0) return null
    const reqRate = needed / ballsLeft
    const strength = Math.min(100, Math.max(0, 50 + (4 - reqRate) * 12 + (wktsLeft - 1) * 2))
    const battingIsTeam1 = currentInn.teamId === match.team1.id
    return battingIsTeam1
      ? { team1: Math.round(strength), team2: Math.round(100 - strength) }
      : { team1: Math.round(100 - strength), team2: Math.round(strength) }
  }, [currentInn, inn1, inn2, match, t1Total, t2Total])

  const requiredPerBall = useMemo(() => {
    if (!currentInn || !inn1 || !inn2 || !match) return null
    const isSecondInn = match.innings.length === 2 && currentInn.teamId !== match.innings[0]?.teamId
    if (!isSecondInn) return null
    const target = inn1.runs + inn1.extras + 1
    const chasingTotal = currentInn.teamId === match.team1.id ? t1Total : t2Total
    const needed = target - chasingTotal
    const ballsLeft = MATCH_CONFIG.totalBalls - currentInn.balls
    if (ballsLeft <= 0) return null
    return { needed, ballsLeft, rpb: (needed / ballsLeft).toFixed(2) }
  }, [currentInn, inn1, inn2, match, t1Total, t2Total])

  const fieldingSummary = useMemo(() => {
    const innBalls = currentInn ? allBallsParsed : []
    const catches = innBalls.filter(b => b.wicket === "caught").length
    const runouts = innBalls.filter(b => b.wicket === "runout").length
    const stumpings = innBalls.filter(b => b.wicket === "stumped").length
    return { catches, runouts, stumpings }
  }, [allBallsParsed, currentInn])

  const overScores = useMemo(() => computeOverScores(allBallsParsed), [allBallsParsed])

  const wormData = useMemo(() => {
    if (!inn1 || !inn2) return null
    const inn1Cum = computeCumulativeScores(inn1BallsParsed)
    const inn2Cum = computeCumulativeScores(inn2BallsParsed)
    const maxOvers = Math.max(inn1Cum.length, inn2Cum.length)
    const maxRuns = Math.max(...inn1Cum, ...inn2Cum, 1)
    return { inn1Cum, inn2Cum, maxOvers, maxRuns }
  }, [inn1BallsParsed, inn2BallsParsed, inn1, inn2])

  const matchHighlights = useMemo(() => {
    return computeMatchHighlights(
      inn1BallsParsed,
      inn2BallsParsed,
      inn1?.teamId === match?.team1.id ? match!.team1Players : match!.team2Players,
      inn1?.teamId === match?.team1.id ? match!.team2Players : match!.team1Players,
      inn1?.teamId === match?.team1.id ? match!.team2Players : match!.team1Players,
      inn1?.teamId === match?.team1.id ? match!.team1Players : match!.team2Players
    )
  }, [inn1BallsParsed, inn2BallsParsed, match])

  const recentOverElements = useMemo(() => {
    if (allBallsParsed.length === 0) return null
    const elements: React.ReactElement[] = []
    let legalCount = 0
    let currentOver = 0
    let overBalls: { ball: BallEvent; idx: number }[] = []

    function flushOver() {
      if (overBalls.length === 0) return
      const overNum = currentOver
      elements.push(
        <div key={`over-${overNum}`} className="mb-2">
          <p className="mb-1 text-[10px] font-semibold text-[var(--muted-foreground)]">Over {overNum + 1}</p>
          <div className="flex flex-wrap gap-1.5">
            {overBalls.map(({ ball, idx }) => {
              const display = getBallDisplay(ball)
              const label = getBallLabel(ball)
              const bowlerName = ball.bowler ? bowlingPlayers.find((p) => p.id === ball.bowler)?.name : ""
              const dismissalText = ball.wicket ? getDismissalText(ball, bowlingPlayers) : ""
              return (
                <div key={idx} className="flex flex-col items-center">
                  <span
                    title={`${label}${bowlerName ? ` - ${bowlerName}` : ""}${display.region ? ` → ${display.region}` : ""}`}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${display.color}`}
                  >
                    {display.text}
                  </span>
                  {display.region && <span className="mt-0.5 text-[7px] font-medium text-green-600 leading-none">{display.region}</span>}
                  {dismissalText && <span className="mt-0.5 text-[7px] font-medium text-purple-500 leading-none text-center max-w-[80px]">{dismissalText}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )
      overBalls = []
    }

    allBallsParsed.forEach((ball, i) => {
      const isLegal = !ball.isWide && !ball.isNoBall
      if (isLegal) {
        if (legalCount > 0 && legalCount % 6 === 0) {
          flushOver()
          currentOver++
        }
        legalCount++
      }
      overBalls.push({ ball, idx: i })
    })
    flushOver()
    return elements
  }, [allBallsParsed, bowlingPlayers])

  const recentOvers = useMemo(() => {
    if (!recentOverElements) return []
    return recentOverElements.slice(-5)
  }, [recentOverElements])

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--muted-foreground)]">No live match at the moment.</p>
        {upcomingMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Upcoming Matches</h2>
            <div className="space-y-3 max-w-md mx-auto">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  {(m as any).matchNo > 0 && <div className="mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {(m as any).matchNo}</div>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {m.team1.logo && <img src={m.team1.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                      <span className="font-medium">{m.team1.name}</span>
                    </div>
                    <span className="text-xs text-[var(--accent)]">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.team2.name}</span>
                      {m.team2.logo && <img src={m.team2.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                    </div>
                  </div>
                  <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{new Date(m.date).toLocaleDateString()} &middot; {(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(m.venue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => { setRefreshing(true); refreshScore() }}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg bg-[var(--muted)] px-4 py-2 text-sm transition-colors hover:bg-[var(--accent)]"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border-2 border-red-500/50 bg-[var(--card)] p-6">
        <div className="mb-4 flex items-center gap-2">
          {match.inningsBreak ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-500">INNINGS BREAK</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="font-semibold text-red-500">LIVE</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              {match.team1.logo && <img src={match.team1.logo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />}
              <p className="truncate font-bold">{match.team1.name}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{inn1 ? `${t1Total}/${inn1.wickets}` : match.team1Score || "-"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{inn1 ? `(${overs1} ov)` : "Yet to bat"}</p>
          </div>
          <div className="min-w-0 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <p className="truncate font-bold">{match.team2.name}</p>
              {match.team2.logo && <img src={match.team2.logo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />}
            </div>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{inn2 ? `${t2Total}/${inn2.wickets}` : match.team2Score || "-"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{inn2 ? `(${overs2} ov)` : "Yet to bat"}</p>
          </div>
        </div>

        {match.result && <p className="mt-4 text-center text-sm font-medium">{match.result}</p>}
        {match.tossWinner && (
          <p className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
            Toss: {match.tossWinner === match.team1.id ? match.team1.name : match.team2.name} won & elected to {match.tossDecision} first
          </p>
        )}
        {(() => {
          if (!inn1 || !inn2 || !currentInn || !currentBattingTeam) return null
          const target = inn1.runs + inn1.extras + 1
          const chasingTotal = currentInn.teamId === match.team1.id ? t1Total : t2Total
          const needed = target - chasingTotal
          const ballsLeft = MATCH_CONFIG.totalBalls - currentInn.balls
          return (
            <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-center">
              <p className="text-xs font-semibold text-amber-600">TARGET</p>
              <p className="text-2xl font-black text-amber-600">{target}</p>
              <p className="text-[10px] text-amber-600/70">
                {currentBattingTeam.shortName} need {Math.max(0, needed)} runs from {Math.max(0, ballsLeft)} balls
              </p>
            </div>
          )
        })()}

        {currentInn && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[var(--muted)] p-2">
              <p className="text-[10px] text-[var(--muted-foreground)]">Powerplay</p>
              <p className="text-sm font-bold text-[var(--accent)]">{formatOvers(currentInn.balls)} / {MATCH_CONFIG.oversPerInnings}.0</p>
              <p className="text-[10px] text-green-600">Active</p>
            </div>
            {requiredPerBall && (
              <div className="rounded-lg bg-amber-500/10 p-2">
                <p className="text-[10px] text-amber-600">Need</p>
                <p className="text-sm font-bold text-amber-600">{requiredPerBall.needed} off {requiredPerBall.ballsLeft}</p>
                <p className="text-[10px] text-amber-600/70">{requiredPerBall.rpb} per ball</p>
              </div>
            )}
            {winProbability && (
              <div className="rounded-lg bg-[var(--muted)] p-2">
                <p className="text-[10px] text-[var(--muted-foreground)]">Win %</p>
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="truncate">{match.team1.shortName}</span>
                    <span className="font-bold" style={{ color: match.team1.color }}>{winProbability.team1}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="truncate">{match.team2.shortName}</span>
                    <span className="font-bold" style={{ color: match.team2.color }}>{winProbability.team2}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {currentInn && (
        <div className="mt-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--card)] p-4">
          <p className="mb-2 text-xs font-semibold text-[var(--accent)]">
            {currentBattingTeam?.shortName} Batting &middot; {currentBowlingTeam?.shortName} Bowling
          </p>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {currentStriker && (
              <div className="min-w-0 overflow-hidden rounded-lg bg-[var(--muted)] p-2">
                <p className="text-[10px] text-[var(--muted-foreground)]">Striker</p>
                <p className="mt-0.5 truncate font-bold text-green-500">{currentStriker.name}</p>
                {activeBatStats[currentStriker.id] && (
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {activeBatStats[currentStriker.id].runs} ({activeBatStats[currentStriker.id].balls})
                  </p>
                )}
              </div>
            )}
            {currentNonStriker && (
              <div className="min-w-0 overflow-hidden rounded-lg bg-[var(--muted)] p-2">
                <p className="text-[10px] text-[var(--muted-foreground)]">Non-Striker</p>
                <p className="mt-0.5 truncate font-bold">{currentNonStriker.name}</p>
                {activeBatStats[currentNonStriker.id] && (
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {activeBatStats[currentNonStriker.id].runs} ({activeBatStats[currentNonStriker.id].balls})
                  </p>
                )}
              </div>
            )}
            {currentBowler && (
              <div className="min-w-0 overflow-hidden rounded-lg bg-[var(--muted)] p-2">
                <p className="text-[10px] text-[var(--muted-foreground)]">Bowler</p>
                <p className="mt-0.5 truncate font-bold text-purple-500">{currentBowler.name}</p>
                {activeBowlStats[currentBowler.id] && (
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    {activeBowlStats[currentBowler.id].wickets}-{activeBowlStats[currentBowler.id].runs}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {currentOverBalls.length > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Current Over</h3>
          <div className="flex flex-wrap gap-2">
            {currentOverBalls.map((ball, i) => {
              const display = getBallDisplay(ball)
              return (
                <span
                  key={i}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${display.color}`}
                >
                  {display.text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {last6Balls.length > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Last 6 Balls</h3>
          <div className="flex gap-2">
            {last6Balls.map((ball, i) => {
              const display = getBallDisplay(ball)
              return (
                <span
                  key={i}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${display.color}`}
                >
                  {display.text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {currentInn && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
            <p className="text-[10px] text-[var(--muted-foreground)]">4s</p>
            <p className="text-lg font-bold text-pink-500">{totalFours}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
            <p className="text-[10px] text-[var(--muted-foreground)]">6s</p>
            <p className="text-lg font-bold text-red-500">{totalSixes}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
            <p className="text-[10px] text-[var(--muted-foreground)]">Fielding</p>
            <div className="flex items-center justify-center gap-1.5 text-[10px]">
              {fieldingSummary.catches > 0 && <span>🙌 {fieldingSummary.catches}</span>}
              {fieldingSummary.runouts > 0 && <span>🎯 {fieldingSummary.runouts}</span>}
              {fieldingSummary.stumpings > 0 && <span>🧤 {fieldingSummary.stumpings}</span>}
              {fieldingSummary.catches === 0 && fieldingSummary.runouts === 0 && fieldingSummary.stumpings === 0 && (
                <span className="text-[var(--muted-foreground)]">-</span>
              )}
            </div>
          </div>
        </div>
      )}

      {currentInn && overScores.length > 1 && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Over-by-Over</h3>
          <div className="flex gap-1.5">
            {overScores.map((runs, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex h-24 items-end">
                  <div
                    className="w-8 rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(8, (runs / Math.max(...overScores, 1)) * 96)}px`,
                      backgroundColor: runs >= 10 ? "var(--accent)" : runs >= 6 ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))",
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)]">{runs}</span>
                <span className="text-[9px] text-[var(--muted-foreground)]/60">O{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inn1 && (
        <div className="mt-4">
          <BattingScorecard
            stats={inn1Stats.batting}
            players={inn1.teamId === match.team1.id ? match.team1Players : match.team2Players}
            battingTeam={inn1.teamId === match.team1.id ? match.team1 : match.team2}
            currentStrikerId={inn1Last?.striker}
            currentNonStrikerId={inn1Last?.nonStriker}
          />
          <div className="mt-3">
            <BowlingScorecard
              stats={inn1Stats.bowling}
              players={inn1.teamId === match.team1.id ? match.team2Players : match.team1Players}
              bowlingTeam={inn1.teamId === match.team1.id ? match.team2 : match.team1}
              currentBowlerId={inn1Last?.bowler}
            />
          </div>
          <PartnershipCard
            ballsData={inn1BallsParsed}
            battingPlayers={inn1.teamId === match.team1.id ? match.team1Players : match.team2Players}
            battingTeam={inn1.teamId === match.team1.id ? match.team1 : match.team2}
            inning={inn1}
          />
        </div>
      )}

      {inn2 && (
        <div className="mt-4">
          <BattingScorecard
            stats={inn2Stats.batting}
            players={inn2.teamId === match.team1.id ? match.team1Players : match.team2Players}
            battingTeam={inn2.teamId === match.team1.id ? match.team1 : match.team2}
            currentStrikerId={inn2Last?.striker}
            currentNonStrikerId={inn2Last?.nonStriker}
          />
          <div className="mt-3">
            <BowlingScorecard
              stats={inn2Stats.bowling}
              players={inn2.teamId === match.team1.id ? match.team2Players : match.team1Players}
              bowlingTeam={inn2.teamId === match.team1.id ? match.team2 : match.team1}
              currentBowlerId={inn2Last?.bowler}
            />
          </div>
          <PartnershipCard
            ballsData={inn2BallsParsed}
            battingPlayers={inn2.teamId === match.team1.id ? match.team1Players : match.team2Players}
            battingTeam={inn2.teamId === match.team1.id ? match.team1 : match.team2}
            inning={inn2}
          />
        </div>
      )}

      {matchHighlights.length > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Match Highlights</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {matchHighlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-[var(--muted)] p-2.5">
                <span className="text-lg">{h.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{h.text}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{h.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wormData && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Worm</h3>
          <div className="flex items-end gap-0.5" style={{ height: "80px" }}>
            {Array.from({ length: wormData.maxOvers }).map((_, overIdx) => {
              const t1Run = wormData.inn1Cum[overIdx] ?? wormData.inn1Cum[wormData.inn1Cum.length - 1] ?? 0
              const t2Run = wormData.inn2Cum[overIdx] ?? wormData.inn2Cum[wormData.inn2Cum.length - 1] ?? 0
              const maxH = 72
              const t1H = wormData.maxRuns > 0 ? (t1Run / wormData.maxRuns) * maxH : 0
              const t2H = wormData.maxRuns > 0 ? (t2Run / wormData.maxRuns) * maxH : 0
              return (
                <div key={overIdx} className="flex flex-1 items-end gap-px" title={`Over ${overIdx + 1}: ${match?.team1.shortName} ${t1Run} | ${match?.team2.shortName} ${t2Run}`}>
                  <div className="w-1/2 rounded-t-sm" style={{ height: `${Math.max(1, t1H)}px`, backgroundColor: match?.team1.color || "var(--accent)" }} />
                  <div className="w-1/2 rounded-t-sm" style={{ height: `${Math.max(1, t2H)}px`, backgroundColor: match?.team2.color || "hsl(var(--chart-2))" }} />
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: match?.team1.color || "var(--accent)" }} />{match?.team1.shortName}</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: match?.team2.color || "hsl(var(--chart-2))" }} />{match?.team2.shortName}</span>
          </div>
        </div>
      )}

      {match && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[match.team1, match.team2].map(team => {
            const form = teamForm[team.id]
            if (!form || form.length === 0) return null
            return (
              <div key={team.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                <p className="mb-2 text-[10px] font-semibold text-[var(--muted-foreground)]">Last {form.length} — {team.shortName}</p>
                <div className="flex gap-1.5">
                  {form.map(r => (
                    <div key={r.matchId} className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white ${r.won ? "bg-green-500" : r.tie ? "bg-amber-500" : "bg-red-500"}`} title={`${r.won ? "W" : r.tie ? "T" : "L"} vs ${r.opponent} (${r.score} vs ${r.opponentScore})`}>
                      {r.won ? "W" : r.tie ? "T" : "L"}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Ball-by-Ball Timeline</h3>
        {recentOvers.length > 0 ? (
          <div
            ref={timelineRef}
            onScroll={handleTimelineScroll}
            className="max-h-96 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
          >
            {recentOvers}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No ball data yet.</p>
        )}
      </div>
    </div>
  )
}
