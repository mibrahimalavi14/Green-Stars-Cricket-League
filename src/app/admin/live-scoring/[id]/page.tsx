"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Plus,
  Undo2,
  RotateCcw,
  Activity,
  Target,
  Shield,
  Zap,
  Trophy,
  Send,
  Flag,
  Loader2,
} from "lucide-react"
import { FieldDiagram } from "@/components/FieldDiagram"

interface Player {
  id: string
  name: string
  role: string
  teamId: string
}

interface Team {
  id: string
  name: string
  shortName: string
  logo: string
  color: string
}

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

interface Innings {
  id: string
  matchId: string
  teamId: string
  runs: number
  wickets: number
  balls: number
  extras: number
  ballsData: BallEvent[]
}

interface MatchData {
  id: string
  team1: Team
  team2: Team
  team1Score: string
  team2Score: string
  status: string
  result: string
  venue: string
  tossWinner: string
  tossDecision: string
}

interface SummaryData {
  match: MatchData
  innings: Innings[]
  team1Players: Player[]
  team2Players: Player[]
}

function formatOvers(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`
}

function ballDisplay(ball: BallEvent): { text: string; color: string; region: string } {
  const region = ball.region ? ball.region : ""
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

export default function LiveScoringPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<SummaryData | null>(null)

  const [battingTeamId, setBattingTeamId] = useState("")
  const [bowlingTeamId, setBowlingTeamId] = useState("")
  const [bowlerId, setBowlerId] = useState("")
  const [strikerId, setStrikerId] = useState("")
  const [nonStrikerId, setNonStrikerId] = useState("")

  const [wicketType, setWicketType] = useState<string | null>(null)
  const [wicketBatsman, setWicketBatsman] = useState("")
  const [wicketFielder, setWicketFielder] = useState("")
  const [pendingExtraRuns, setPendingExtraRuns] = useState<number | null>(null)
  const [pendingExtraType, setPendingExtraType] = useState<string | null>(null)
  const [ballRegion, setBallRegion] = useState("")

  const [activeInnings, setActiveInnings] = useState<Innings | null>(null)
  const [inningsNum, setInningsNum] = useState(1)
  const [endMatchConfirm, setEndMatchConfirm] = useState(false)
  const [endingMatch, setEndingMatch] = useState(false)
  const [tossWinner, setTossWinner] = useState("")
  const [tossDecision, setTossDecision] = useState("")
  const [superOverT1Runs, setSuperOverT1Runs] = useState("")
  const [superOverT1Wkts, setSuperOverT1Wkts] = useState("")
  const [superOverT2Runs, setSuperOverT2Runs] = useState("")
  const [superOverT2Wkts, setSuperOverT2Wkts] = useState("")

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/summary?matchId=${matchId}`)
      if (res.ok) {
        const data: SummaryData = await res.json()
        setSummary(data)
      }
    } catch {}
  }, [matchId])

  useEffect(() => {
    fetchSummary().then(() => setLoading(false))
    pollRef.current = setInterval(fetchSummary, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchSummary])

  useEffect(() => {
    if (!summary) return
    if (summary.match.tossWinner && !tossWinner) setTossWinner(summary.match.tossWinner)
    if (summary.match.tossDecision && !tossDecision) setTossDecision(summary.match.tossDecision)
    const m = summary.match
    const tw = tossWinner || m.tossWinner
    const td = tossDecision || m.tossDecision
    if (summary.innings.length <= 1) {
      if (tw && td) {
        const t1BattingFirst = td === "bat"
          ? tw === m.team1.id
          : tw === m.team2.id
        setBattingTeamId(t1BattingFirst ? m.team1.id : m.team2.id)
        setBowlingTeamId(t1BattingFirst ? m.team2.id : m.team1.id)
      } else {
        setBattingTeamId(m.team1.id)
        setBowlingTeamId(m.team2.id)
      }
      setInningsNum(1)
    } else {
      const inn = summary.innings[summary.innings.length - 1]
      setBattingTeamId(inn.teamId)
      const otherTeamId = inn.teamId === m.team1.id ? m.team2.id : m.team1.id
      setBowlingTeamId(otherTeamId)
      setInningsNum(summary.innings.length)
    }
  }, [summary, tossWinner, tossDecision])

  useEffect(() => {
    if (!summary) return
    const inn = summary.innings.find((i) => i.teamId === battingTeamId)
    setActiveInnings(inn || null)
  }, [summary, battingTeamId])

  useEffect(() => {
    setBowlerId("")
    setStrikerId("")
    setNonStrikerId("")
  }, [bowlingTeamId, battingTeamId])

  const ROLE_ORDER_BATTING: Record<string, number> = { "Batsman": 0, "Wicket-keeper": 1, "All-rounder": 2, "Bowler": 3 }
  const ROLE_ORDER_BOWLING: Record<string, number> = { "Bowler": 0, "All-rounder": 1, "Wicket-keeper": 2, "Batsman": 3 }

  const battingPlayers = summary
    ? (battingTeamId === summary.match.team1.id
        ? [...summary.team1Players].sort((a, b) => (ROLE_ORDER_BATTING[a.role] ?? 9) - (ROLE_ORDER_BATTING[b.role] ?? 9))
        : [...summary.team2Players].sort((a, b) => (ROLE_ORDER_BATTING[a.role] ?? 9) - (ROLE_ORDER_BATTING[b.role] ?? 9)))
    : []

  const bowlingPlayers = summary
    ? (bowlingTeamId === summary.match.team1.id
        ? [...summary.team1Players].sort((a, b) => (ROLE_ORDER_BOWLING[a.role] ?? 9) - (ROLE_ORDER_BOWLING[b.role] ?? 9))
        : [...summary.team2Players].sort((a, b) => (ROLE_ORDER_BOWLING[a.role] ?? 9) - (ROLE_ORDER_BOWLING[b.role] ?? 9)))
    : []

  function getCurrentOverBalls(balls: BallEvent[]): BallEvent[] {
    if (balls.length === 0) return []
    const legalCount = balls.filter(
      (b) => !b.isWide && !b.isNoBall
    ).length
    const oversCompleted = Math.floor(legalCount / 6)
    let count = 0
    let startIdx = 0
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].isWide && !balls[i].isNoBall) {
        count++
        if (count === oversCompleted * 6 + 1) {
          startIdx = i
          break
        }
      }
    }
    return balls.slice(startIdx)
  }

  const currentOverBalls = activeInnings
    ? getCurrentOverBalls(activeInnings.ballsData)
    : []

  const innings1 = summary?.innings.find(
    (i) => i.teamId === (summary?.match.team1.id)
  )
  const innings2 = summary?.innings.find(
    (i) => i.teamId === (summary?.match.team2.id)
  )

  function calcRequiredRunRate(): number | null {
    if (!innings1 || battingTeamId !== summary?.match.team2.id) return null
    const target = innings1.runs + innings1.extras + 1
    const remaining = 60 - (activeInnings?.balls || 0)
    if (remaining <= 0) return 0
    return Number((((target - (activeInnings?.runs || 0) - (activeInnings?.extras || 0)) / remaining) * 6).toFixed(2))
  }

  function calcCurrentRunRate(): number {
    if (!activeInnings || activeInnings.balls === 0) return 0
    return Number(((activeInnings.runs / activeInnings.balls) * 6).toFixed(2))
  }

  async function addBall(ball: BallEvent) {
    if (!battingTeamId || !strikerId || !bowlerId) {
      alert("Please select batting team, striker, and bowler")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/live/balls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, battingTeamId, ball }),
      })
      if (res.ok) {
        setWicketType(null)
        setWicketBatsman("")
        setWicketFielder("")
        setPendingExtraRuns(null)
        setPendingExtraType(null)
        setBallRegion("")
        fetch("/api/live/sync-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        })
        await fetchSummary()
        if (ball.wicket) {
          setStrikerId("")
        } else if (ball.runs % 2 === 1) {
          const tmp = strikerId
          setStrikerId(nonStrikerId)
          setNonStrikerId(tmp)
        }
      }
    } catch {}
    setSubmitting(false)
  }

  async function undoBall() {
    if (!activeInnings) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/live/balls/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inningsId: activeInnings.id }),
      })
      if (res.ok) {
        fetch("/api/live/sync-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        })
        await fetchSummary()
      }
    } catch {}
    setSubmitting(false)
  }

  function handleRun(runs: number) {
    if (wicketType) {
      addBall({
        runs,
        extras: null,
        wicket: wicketType,
        bowler: bowlerId,
        striker: strikerId,
        nonStriker: nonStrikerId,
        wicketBatsman: wicketBatsman || strikerId,
        wicketFielder: wicketFielder || null,
        isWide: false,
        isNoBall: false,
        byes: 0,
        legByes: 0,
        region: ballRegion,
      })
    } else {
      addBall({
        runs,
        extras: null,
        wicket: null,
        bowler: bowlerId,
        striker: strikerId,
        nonStriker: nonStrikerId,
        wicketBatsman: null,
        wicketFielder: null,
        isWide: false,
        isNoBall: false,
        byes: 0,
        legByes: 0,
        region: ballRegion,
      })
    }
  }

  function handleExtra(type: string) {
    if (type === "wide" || type === "noball") {
      addBall({
        runs: 0,
        extras: type,
        wicket: wicketType,
        bowler: bowlerId,
        striker: strikerId,
        nonStriker: nonStrikerId,
        wicketBatsman: wicketType ? (wicketBatsman || strikerId) : null,
        wicketFielder: wicketType ? wicketFielder : null,
        isWide: type === "wide",
        isNoBall: type === "noball",
        byes: 0,
        legByes: 0,
        region: ballRegion,
      })
    } else {
      setPendingExtraType(type)
      setPendingExtraRuns(null)
    }
  }

  function handleExtraRuns(runs: number) {
    if (!pendingExtraType) return
    addBall({
      runs: 0,
      extras: pendingExtraType,
      wicket: wicketType,
      bowler: bowlerId,
      striker: strikerId,
      nonStriker: nonStrikerId,
      wicketBatsman: wicketType ? (wicketBatsman || strikerId) : null,
      wicketFielder: wicketType ? wicketFielder : null,
      isWide: false,
      isNoBall: false,
      byes: pendingExtraType === "bye" ? runs : 0,
      legByes: pendingExtraType === "legbye" ? runs : 0,
      region: ballRegion,
    })
  }

  async function handleEndMatch() {
    if (!summary || !activeInnings) return
    setEndingMatch(true)
    try {
      const allInnings = summary.innings
      const match = summary.match

      const team1Inn = allInnings.find((i) => i.teamId === match.team1.id)
      const team2Inn = allInnings.find((i) => i.teamId === match.team2.id)

      const t1Runs = team1Inn ? team1Inn.runs : 0
      const t1Wkts = team1Inn ? team1Inn.wickets : 0
      const t1Balls = team1Inn ? team1Inn.balls : 0
      const t1Extras = team1Inn ? team1Inn.extras : 0
      const t2Runs = team2Inn ? team2Inn.runs : 0
      const t2Wkts = team2Inn ? team2Inn.wickets : 0
      const t2Balls = team2Inn ? team2Inn.balls : 0
      const t2Extras = team2Inn ? team2Inn.extras : 0

      const t1Total = t1Runs + t1Extras
      const t2Total = t2Runs + t2Extras

      let result = ""
      if (t1Total > t2Total) {
        const diff = t1Total - t2Total
        result = `${match.team1.name} won by ${diff} run${diff !== 1 ? "s" : ""}`
      } else if (t2Total > t1Total) {
        const wktsLeft = 10 - t2Wkts
        result = `${match.team2.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`
      } else {
        const so1Runs = parseInt(superOverT1Runs) || 0
        const so2Runs = parseInt(superOverT2Runs) || 0
        const so1Wkts = parseInt(superOverT1Wkts) || 0
        const so2Wkts = parseInt(superOverT2Wkts) || 0
        if (so1Runs || so2Runs) {
          if (so1Runs > so2Runs) result = `${match.team1.name} won the Super Over (${so1Runs}/${so1Wkts} - ${so2Runs}/${so2Wkts})`
          else if (so2Runs > so1Runs) result = `${match.team2.name} won the Super Over (${so2Runs}/${so2Wkts} - ${so1Runs}/${so1Wkts})`
          else result = "Match Tied (Super Over tied again)"
        } else {
          result = "Match Tied"
        }
      }

      const playerStats: Record<string, any> = {}

      function ensurePlayer(pid: string, teamId: string) {
        if (!playerStats[pid]) {
          playerStats[pid] = {
            playerId: pid,
            teamId,
            battingRuns: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            ones: 0,
            twos: 0,
            isOut: false,
            wicketsLost: 0,
            dismissalType: "",
            dismissedByBowlerId: "",
            dismissedByFielderId: "",
            bowlingWickets: 0,
            bowlingRuns: 0,
            ballsBowled: 0,
            maidens: 0,
            wides: 0,
            noBalls: 0,
            catches: 0,
            stumpings: 0,
            runOuts: 0,
          }
        }
      }

      for (const inn of allInnings) {
        const bowlingTeamId = inn.teamId === match.team1.id
          ? match.team2.id
          : match.team1.id
        const balls: BallEvent[] = inn.ballsData

        for (const ball of balls) {
          ensurePlayer(ball.striker, inn.teamId)
          ensurePlayer(ball.bowler, bowlingTeamId)
          if (ball.nonStriker) ensurePlayer(ball.nonStriker, inn.teamId)

          const ps = playerStats[ball.striker]
          ps.ballsFaced++
          ps.battingRuns += ball.runs
          if (ball.runs === 1) ps.ones++
          if (ball.runs === 2) ps.twos++
          if (ball.runs === 4) ps.fours++
          if (ball.runs === 6) ps.sixes++

          const bps = playerStats[ball.bowler]
          if (!ball.isWide && !ball.isNoBall) {
            bps.ballsBowled++
          }
          bps.bowlingRuns += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + ball.byes + ball.legByes
          if (ball.isWide) bps.wides++
          if (ball.isNoBall) bps.noBalls++

          if (ball.isWide || ball.isNoBall) {
            ps.ballsFaced--
          }

          if (ball.wicket) {
            bps.bowlingWickets++
            const dismissed = ball.wicketBatsman || ball.striker
            ensurePlayer(dismissed, inn.teamId)
            const dps = playerStats[dismissed]
            dps.isOut = true
            dps.wicketsLost = 1
            dps.dismissalType = ball.wicket
            if (ball.wicket !== "runout") {
              dps.dismissedByBowlerId = ball.bowler
            }
            if (ball.wicketFielder) {
              dps.dismissedByFielderId = ball.wicketFielder
              ensurePlayer(ball.wicketFielder, bowlingTeamId)
              const fps = playerStats[ball.wicketFielder]
              if (ball.wicket === "caught") fps.catches++
              if (ball.wicket === "stumped") fps.stumpings++
              if (ball.wicket === "runout") fps.runOuts++
            }
          }
        }

        const bowlingTeamPlayers = Object.keys(playerStats).filter(
          (pid) => playerStats[pid].teamId === bowlingTeamId && playerStats[pid].ballsBowled > 0
        )
        let overStart = true
        let legalInOver = 0
        for (const ball of balls) {
          if (!ball.isWide && !ball.isNoBall) {
            legalInOver++
            if (legalInOver % 6 === 1) overStart = true
          }
          if (overStart && !ball.isWide && !ball.isNoBall) {
            overStart = false
          }
        }
      }

      const playersData = Object.values(playerStats)

      let mom = ""
      if (playersData.length > 0) {
        let bestScore = -Infinity
        for (const p of playersData) {
          const sr = p.ballsFaced > 0 ? (p.battingRuns / p.ballsFaced) * 100 : 0
          const econ = p.ballsBowled > 0 ? p.bowlingRuns / (p.ballsBowled / 6) : 0
          const battingImpact = (
            p.battingRuns
            + (p.ballsFaced >= 5
              ? sr >= 200 ? p.battingRuns * 0.3
              : sr >= 150 ? p.battingRuns * 0.2
              : sr >= 100 ? p.battingRuns * 0.1
              : 0
              : 0)
            + p.fours * 2
            + p.sixes * 5
            + (p.isOut ? 0 : 15)
            + (p.battingRuns === 0 && p.isOut ? -15 : 0)
            - (p.wicketsLost || 0) * 5
          )
          const bowlingImpact = (
            p.bowlingWickets * 25
            + p.maidens * 12
            + (p.ballsBowled >= 6
              ? econ <= 4 ? 20 : econ <= 6 ? 12 : econ <= 8 ? 6 : econ <= 10 ? 0 : -10
              : 0)
            - p.bowlingRuns * 0.5
            - (p.wides + p.noBalls) * 2
          )
          const fieldingImpact = p.catches * 12 + p.stumpings * 18 + p.runOuts * 20
          let total = battingImpact + bowlingImpact + fieldingImpact
          if (p.battingRuns >= 30 && p.bowlingWickets >= 2) total += 25
          if (p.battingRuns >= 50 && p.bowlingWickets >= 1) total += 35
          if (p.bowlingWickets >= 4) total += 20
          if (p.bowlingWickets >= 5) total += 40
          if (total > bestScore) { bestScore = total; mom = p.playerId }
        }
      }

      if (playersData.length > 0) {
        await fetch("/api/performances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, players: playersData }),
        })
      }

      await fetch("/api/innings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          innings: [
            {
              teamId: match.team1.id,
              runs: t1Runs,
              wickets: t1Wkts,
              balls: t1Balls,
              extras: t1Extras,
            },
            {
              teamId: match.team2.id,
              runs: t2Runs,
              wickets: t2Wkts,
              balls: t2Balls,
              extras: t2Extras,
            },
          ],
        }),
      })

      await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchId,
          status: "completed",
          result,
          manOfMatch: mom,
          tossWinner: summary.match.tossWinner || tossWinner,
          tossDecision: summary.match.tossDecision || tossDecision,
          team1Score: `${t1Total}/${t1Wkts}${t1Balls ? ` (${formatOvers(t1Balls)} ov)` : ""}`,
          team2Score: `${t2Total}/${t2Wkts}${t2Balls ? ` (${formatOvers(t2Balls)} ov)` : ""}`,
          superOverT1Runs: parseInt(superOverT1Runs) || 0,
          superOverT1Wkts: parseInt(superOverT1Wkts) || 0,
          superOverT2Runs: parseInt(superOverT2Runs) || 0,
          superOverT2Wkts: parseInt(superOverT2Wkts) || 0,
        }),
      })

      router.push("/admin/matches")
    } catch (err) {
      alert("Error ending match. Please try again.")
    }
    setEndingMatch(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Match not found</p>
      </div>
    )
  }

  const match = summary.match
  const overs1 = innings1 ? formatOvers(innings1.balls) : "0.0"
  const overs2 = innings2 ? formatOvers(innings2.balls) : "0.0"
  const t1Total = innings1 ? innings1.runs + innings1.extras : 0
  const t2Total = innings2 ? innings2.runs + innings2.extras : 0
  const rrr = calcRequiredRunRate()
  const crr = calcCurrentRunRate()

  const battingTeamName = battingTeamId === match.team1.id ? match.team1.name : match.team2.name
  const battingShort = battingTeamId === match.team1.id ? match.team1.shortName : match.team2.shortName
  const bowlingTeamName = bowlingTeamId === match.team1.id ? match.team1.name : match.team2.name

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-3 py-4 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/admin/matches")}
            className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--accent)]"
          >
            <RotateCcw className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE SCORING
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-xl border-2 border-[var(--accent)]/30 bg-[var(--card)] p-4">
          <div className="grid grid-cols-3 items-center gap-4 text-center">
            <div>
              <div className="mb-1 flex items-center justify-center gap-2">
                {match.team1.logo && (
                  <img src={match.team1.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
                <p className="font-bold">{match.team1.shortName}</p>
              </div>
              <p className="text-3xl font-black tabular-nums">
                {innings1 ? `${innings1.runs + innings1.extras}/${innings1.wickets}` : "-"}
              </p>
              {innings1 && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  ({overs1} ov)
                </p>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--accent)]">VS</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {match.venue}
              </p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-center gap-2">
                <p className="font-bold">{match.team2.shortName}</p>
                {match.team2.logo && (
                  <img src={match.team2.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
              </div>
              <p className="text-3xl font-black tabular-nums">
                {innings2 ? `${innings2.runs + innings2.extras}/${innings2.wickets}` : "-"}
              </p>
              {innings2 && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  ({overs2} ov)
                </p>
              )}
            </div>
          </div>
          {match.result && (
            <p className="mt-2 text-center text-sm font-medium text-[var(--accent)]">{match.result}</p>
          )}
          {(tossWinner || summary.match.tossWinner) && (
            <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">
              Toss: {(tossWinner || summary.match.tossWinner) === match.team1.id ? match.team1.name : match.team2.name} won & elected to {tossDecision || summary.match.tossDecision} first
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-3 rounded-xl border-2 border-yellow-500/40 bg-yellow-500/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-yellow-600">
                    <Trophy className="h-4 w-4" /> TOSS
                  </p>
                  {(tossWinner || summary.match.tossWinner) ? (
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-600">
                      {(tossWinner || summary.match.tossWinner) === match.team1.id ? match.team1.shortName : match.team2.shortName} elected to {tossDecision || summary.match.tossDecision} first
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">Not set yet</span>
                  )}
                </div>
                {!(summary.match.tossWinner && summary.match.tossDecision) ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">Toss Winner</label>
                      <select
                        value={tossWinner}
                        onChange={(e) => setTossWinner(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      >
                        <option value="">— Select —</option>
                        <option value={match.team1.id}>{match.team1.name}</option>
                        <option value={match.team2.id}>{match.team2.name}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">Decision</label>
                      <div className="flex gap-2">
                        <select
                          value={tossDecision}
                          onChange={(e) => setTossDecision(e.target.value)}
                          disabled={!tossWinner}
                          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-40"
                        >
                          <option value="">— Select —</option>
                          <option value="bat">Bat First</option>
                          <option value="bowl">Bowl First</option>
                        </select>
                        <button
                          onClick={async () => {
                            if (!tossWinner || !tossDecision) return
                            const t1BattingFirst = tossDecision === "bat"
                              ? tossWinner === match.team1.id
                              : tossWinner === match.team2.id
                            setBattingTeamId(t1BattingFirst ? match.team1.id : match.team2.id)
                            setBowlingTeamId(t1BattingFirst ? match.team2.id : match.team1.id)
                            const res = await fetch("/api/matches", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: matchId, tossWinner, tossDecision }),
                            })
                            if (!res.ok) { alert("Failed to save toss"); return }
                            await fetchSummary()
                          }}
                          disabled={!tossWinner || !tossDecision}
                          className="flex items-center gap-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-600 disabled:opacity-40"
                        >
                          Set Toss
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                        <Shield className="h-3 w-3" /> Batting Team
                      </label>
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2 text-sm font-medium">
                        {battingTeamId === match.team1.id ? match.team1.name : match.team2.name}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                        <Target className="h-3 w-3" /> Bowling Team
                      </label>
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2 text-sm font-medium">
                        {bowlingTeamId === match.team1.id ? match.team1.name : match.team2.name}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                      {tossWinner === match.team1.id ? match.team1.name : match.team2.name} won the toss & elected to {tossDecision} first
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">
                    Bowler
                  </label>
                  <select
                    value={bowlerId}
                    onChange={(e) => setBowlerId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {bowlingPlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">
                    Striker
                  </label>
                  <select
                    value={strikerId}
                    onChange={(e) => setStrikerId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {battingPlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted-foreground)]">
                    Non-Striker
                  </label>
                  <select
                    value={nonStrikerId}
                    onChange={(e) => setNonStrikerId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {battingPlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {wicketType && (
                <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <p className="mb-2 text-xs font-bold text-purple-500">
                    WICKET: {wicketType.toUpperCase()}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-[var(--muted-foreground)]">Who is out?</label>
                      <select
                        value={wicketBatsman}
                        onChange={(e) => setWicketBatsman(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
                      >
                        <option value="">Current Striker</option>
                        {battingPlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    {(wicketType === "caught" || wicketType === "stumped" || wicketType === "runout") && (
                      <div>
                        <label className="mb-1 block text-xs text-[var(--muted-foreground)]">
                          {wicketType === "caught" ? "Caught by?" : wicketType === "stumped" ? "Stumped by?" : "Run out by?"}
                        </label>
                        <select
                          value={wicketFielder}
                          onChange={(e) => setWicketFielder(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm"
                        >
                          <option value="">Select fielder</option>
                          {bowlingPlayers.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleRun(0)}
                      disabled={submitting}
                      className="flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" /> Confirm OUT
                    </button>
                    <button
                      onClick={() => {
                        setWicketType(null)
                        setWicketBatsman("")
                        setWicketFielder("")
                      }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {pendingExtraType && (
                <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="mb-2 text-xs font-bold text-yellow-600">
                    {pendingExtraType === "bye" ? "BYE" : "LEG BYE"} — How many runs?
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleExtraRuns(r)}
                        disabled={submitting}
                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500 text-lg font-bold text-white hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setPendingExtraType(null)
                        setPendingExtraRuns(null)
                      }}
                      className="rounded-lg bg-[var(--muted)] px-4 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted-foreground)]/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">FIELD</span>
                  {ballRegion && (
                    <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                      {ballRegion}
                    </span>
                  )}
                </div>
                <FieldDiagram selected={ballRegion} onSelect={setBallRegion} />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["", "Off", "Cover", "Mid Off", "Mid On", "Leg", "Fine Leg", "Square Leg", "Mid Wkt", "Long On", "Long Off", "Third", "Point", "Gully", "Slip", "Straight"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setBallRegion(r)}
                      className={`rounded px-2 py-1 text-[10px] font-medium transition-all ${
                        ballRegion === r
                          ? "bg-green-500 text-white"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                      }`}
                    >
                      {r || "All"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">
                RUNS
              </div>
              <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRun(r)}
                    disabled={submitting || !strikerId || !bowlerId}
                    className={`flex h-14 items-center justify-center rounded-xl text-xl font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40 ${
                      r === 0
                        ? "bg-[var(--muted)] hover:bg-[var(--muted)]/80"
                        : r === 4
                        ? "bg-pink-500 text-white hover:bg-pink-600"
                        : r === 6
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">
                EXTRAS
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  onClick={() => handleExtra("wide")}
                  disabled={submitting || !strikerId || !bowlerId}
                  className="flex h-12 items-center justify-center gap-1 rounded-xl bg-gray-500 text-sm font-bold text-white hover:bg-gray-600 disabled:opacity-40"
                >
                  <Zap className="h-3 w-3" /> Wide
                </button>
                <button
                  onClick={() => handleExtra("noball")}
                  disabled={submitting || !strikerId || !bowlerId}
                  className="flex h-12 items-center justify-center gap-1 rounded-xl bg-gray-500 text-sm font-bold text-white hover:bg-gray-600 disabled:opacity-40"
                >
                  <Zap className="h-3 w-3" /> No Ball
                </button>
                <button
                  onClick={() => handleExtra("bye")}
                  disabled={submitting || !strikerId || !bowlerId}
                  className="flex h-12 items-center justify-center gap-1 rounded-xl bg-gray-600 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-40"
                >
                  Bye
                </button>
                <button
                  onClick={() => handleExtra("legbye")}
                  disabled={submitting || !strikerId || !bowlerId}
                  className="flex h-12 items-center justify-center gap-1 rounded-xl bg-gray-600 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-40"
                >
                  Leg Bye
                </button>
              </div>

              <div className="mb-2 text-xs font-semibold text-[var(--muted-foreground)]">
                WICKETS
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {[
                  { type: "bowled", label: "Bowled" },
                  { type: "caught", label: "Caught" },
                  { type: "lbw", label: "LBW" },
                  { type: "stumped", label: "Stumped" },
                  { type: "runout", label: "Run Out" },
                  { type: "hit wicket", label: "Hit Wicket" },
                  { type: "retired", label: "Retired" },
                  { type: "obstructing", label: "Obstruct" },
                ].map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (wicketType === type) {
                        setWicketType(null)
                        setWicketBatsman("")
                        setWicketFielder("")
                      } else {
                        setWicketType(type)
                        setWicketBatsman("")
                        setWicketFielder("")
                      }
                    }}
                    disabled={submitting || !strikerId || !bowlerId}
                    className={`flex h-12 items-center justify-center gap-1 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                      wicketType === type
                        ? "bg-purple-600 text-white ring-2 ring-purple-400"
                        : "bg-purple-600/20 text-purple-500 hover:bg-purple-600/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={undoBall}
                  disabled={submitting || !activeInnings || activeInnings.ballsData.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500/20 px-4 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-500/30 disabled:opacity-40"
                >
                  <Undo2 className="h-4 w-4" /> Undo Last Ball
                </button>
                <button
                  onClick={() => setEndMatchConfirm(true)}
                  disabled={endingMatch}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/30 disabled:opacity-40"
                >
                  <Flag className="h-4 w-4" /> End Match
                </button>
              </div>

              {endMatchConfirm && (() => {
                const inn1 = summary?.innings.find(i => i.teamId === summary?.match.team1.id)
                const inn2 = summary?.innings.find(i => i.teamId === summary?.match.team2.id)
                const total1 = inn1 ? inn1.runs + inn1.extras : 0
                const total2 = inn2 ? inn2.runs + inn2.extras : 0
                const isTied = total1 > 0 && total2 > 0 && total1 === total2
                return (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="mb-2 text-sm font-semibold text-red-500">
                    End match and save all stats?
                  </p>
                  <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                    This will calculate player performances, save innings totals, and mark the match as completed.
                  </p>
                  {isTied && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-700/40 dark:bg-amber-900/10">
                      <p className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">Match Tied — Enter Super Over Scores</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-xs">{summary?.match.team1.name} Runs</label>
                          <input type="number" min="0" value={superOverT1Runs} onChange={e => setSuperOverT1Runs(e.target.value)}
                            className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-sm dark:bg-[var(--card)]" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">Wickets</label>
                          <input type="number" min="0" max="2" value={superOverT1Wkts} onChange={e => setSuperOverT1Wkts(e.target.value)}
                            className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-sm dark:bg-[var(--card)]" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">{summary?.match.team2.name} Runs</label>
                          <input type="number" min="0" value={superOverT2Runs} onChange={e => setSuperOverT2Runs(e.target.value)}
                            className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-sm dark:bg-[var(--card)]" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs">Wickets</label>
                          <input type="number" min="0" max="2" value={superOverT2Wkts} onChange={e => setSuperOverT2Wkts(e.target.value)}
                            className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-sm dark:bg-[var(--card)]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleEndMatch}
                      disabled={endingMatch}
                      className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {endingMatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                      {endingMatch ? "Saving..." : "Yes, End Match"}
                    </button>
                    <button
                      onClick={() => setEndMatchConfirm(false)}
                      className="rounded-lg bg-[var(--muted)] px-4 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                )
              })()}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            {currentOverBalls.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                  <Activity className="h-3 w-3" /> CURRENT OVER
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentOverBalls.map((ball, i) => {
                    const display = ballDisplay(ball)
                    return (
                      <span
                        key={i}
                        title={display.region || "No region"}
                        className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${display.color}`}
                      >
                        {display.text}
                        {display.region && (
                          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[7px] font-medium text-[var(--muted-foreground)] opacity-60">
                            {display.region.slice(0, 4)}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {activeInnings && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-[var(--muted)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">CRR</p>
                    <p className="text-xl font-bold tabular-nums">{crr}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">RRR</p>
                    <p className="text-xl font-bold tabular-nums">{rrr !== null ? rrr : "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeInnings && activeInnings.ballsData.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                  <Activity className="h-3 w-3" /> INNINGS {inningsNum} — {battingTeamName}
                </p>
                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-[var(--muted-foreground)]">Runs</p>
                    <p className="text-lg font-bold">{activeInnings.runs + activeInnings.extras}</p>
                  </div>
                  <div>
                    <p className="text-[var(--muted-foreground)]">Wickets</p>
                    <p className="text-lg font-bold">{activeInnings.wickets}</p>
                  </div>
                  <div>
                    <p className="text-[var(--muted-foreground)]">Overs</p>
                    <p className="text-lg font-bold">{formatOvers(activeInnings.balls)}</p>
                  </div>
                </div>

                <p className="mb-1 text-xs font-semibold text-[var(--muted-foreground)]">Batting</p>
                <div className="mb-3 max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                        <th className="py-1 text-left font-medium">Batsman</th>
                        <th className="py-1 text-center font-medium">R</th>
                        <th className="py-1 text-center font-medium">B</th>
                        <th className="py-1 text-center font-medium">1s</th>
                        <th className="py-1 text-center font-medium">2s</th>
                        <th className="py-1 text-center font-medium">4s</th>
                        <th className="py-1 text-center font-medium">6s</th>
                        <th className="py-1 text-center font-medium">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingPlayers
                        .filter((p) => {
                          return activeInnings.ballsData.some(
                            (b) => b.striker === p.id || b.nonStriker === p.id
                          )
                        })
                        .map((p) => {
                          const balls = activeInnings.ballsData.filter(
                            (b) => b.striker === p.id
                          )
                          const runs = balls.reduce((s, b) => s + b.runs, 0)
                          const legalBalls = balls.filter(
                            (b) => !b.isWide && !b.isNoBall
                          ).length
                          const ones = balls.filter((b) => b.runs === 1).length
                          const twos = balls.filter((b) => b.runs === 2).length
                          const threes = balls.filter((b) => b.runs === 3).length
                          const fours = balls.filter((b) => b.runs === 4).length
                          const sixes = balls.filter((b) => b.runs === 6).length
                          const isOut = activeInnings.ballsData.some(
                            (b) => b.wicket && (b.wicketBatsman === p.id || (!b.wicketBatsman && b.striker === p.id))
                          )
                          const sr = legalBalls > 0 ? ((runs / legalBalls) * 100).toFixed(1) : "0.0"
                          const isOnStrike = p.id === strikerId
                          return (
                            <tr key={p.id} className={`border-b border-[var(--border)] ${isOnStrike ? "bg-[var(--accent)]/10 font-bold" : ""}`}>
                              <td className="py-1 text-left">
                                {p.name} {isOnStrike ? "*" : ""} {isOut ? "†" : ""}
                              </td>
                              <td className="py-1 text-center">{runs}</td>
                              <td className="py-1 text-center">{legalBalls}</td>
                              <td className="py-1 text-center text-blue-400">{ones}</td>
                              <td className="py-1 text-center text-yellow-400">{twos}</td>
                              <td className="py-1 text-center">{fours}</td>
                              <td className="py-1 text-center">{sixes}</td>
                              <td className="py-1 text-center">{sr}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>

                <p className="mb-1 text-xs font-semibold text-[var(--muted-foreground)]">Bowling</p>
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                        <th className="py-1 text-left font-medium">Bowler</th>
                        <th className="py-1 text-center font-medium">O</th>
                        <th className="py-1 text-center font-medium">R</th>
                        <th className="py-1 text-center font-medium">W</th>
                        <th className="py-1 text-center font-medium">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingPlayers
                        .filter((p) =>
                          activeInnings.ballsData.some((b) => b.bowler === p.id)
                        )
                        .map((p) => {
                          const balls = activeInnings.ballsData.filter(
                            (b) => b.bowler === p.id
                          )
                          const legalBalls = balls.filter(
                            (b) => !b.isWide && !b.isNoBall
                          ).length
                          const runsConceded = balls.reduce(
                            (s, b) => s + b.runs + (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0) + b.byes + b.legByes,
                            0
                          )
                          const wickets = balls.filter((b) => b.wicket).length
                          const econ =
                            legalBalls > 0
                              ? ((runsConceded / legalBalls) * 6).toFixed(1)
                              : "0.0"
                          const isBowlerCurrent = p.id === bowlerId
                          return (
                            <tr key={p.id} className={`border-b border-[var(--border)] ${isBowlerCurrent ? "bg-[var(--accent)]/10 font-bold" : ""}`}>
                              <td className="py-1 text-left">{p.name}</td>
                              <td className="py-1 text-center">{formatOvers(legalBalls)}</td>
                              <td className="py-1 text-center">{runsConceded}</td>
                              <td className="py-1 text-center">{wickets}</td>
                              <td className="py-1 text-center">{econ}</td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                <Activity className="h-3 w-3" /> ALL BALLS
              </p>
              {activeInnings && activeInnings.ballsData.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeInnings.ballsData.map((ball, i) => {
                    const display = ballDisplay(ball)
                    const overNum = Math.floor(
                      activeInnings.ballsData
                        .slice(0, i + 1)
                        .filter((b) => !b.isWide && !b.isNoBall).length / 6
                    )
                    const prevOvers = activeInnings.ballsData
                      .slice(0, i)
                      .filter((b) => !b.isWide && !b.isNoBall).length
                    const isOverBoundary =
                      i > 0 &&
                      !ball.isWide &&
                      !ball.isNoBall &&
                      prevOvers % 6 === 5
                    return (
                      <span key={i} className="group relative inline-flex items-center gap-0.5">
                        {isOverBoundary && (
                          <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">|</span>
                        )}
                        <span
                          title={display.region || ""}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${display.color}`}
                        >
                          {display.text}
                        </span>
                        {display.region && (
                          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--background)] px-1 text-[7px] text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100">
                            {display.region}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-[var(--muted-foreground)]">No balls recorded yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
