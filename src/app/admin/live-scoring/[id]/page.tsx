"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
  CheckCircle,
  CloudOff,
  RefreshCw,
} from "lucide-react"
import { FieldDiagram } from "@/components/FieldDiagram"
import { MATCH_CONFIG, isMatchComplete, formatOvers } from "@/lib/config"
import { loadOfflineQueue, addToOfflineQueue, removeFromOfflineQueue, createBallId } from "@/lib/offline-queue"
import { useOfflineQueue } from "@/hooks/useOfflineQueue"

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
  id?: string
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
  inningsBreak: boolean
  customHighlights: string
}

interface SummaryData {
  match: MatchData
  innings: Innings[]
  team1Players: Player[]
  team2Players: Player[]
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

  const [battingTeamId, setBattingTeamId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`ls-${matchId}-bat`) || ""
    return ""
  })
  const [bowlingTeamId, setBowlingTeamId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`ls-${matchId}-bowl`) || ""
    return ""
  })
  const [bowlerId, setBowlerId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`ls-${matchId}-bowler`) || ""
    return ""
  })
  const [strikerId, setStrikerId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`ls-${matchId}-striker`) || ""
    return ""
  })
  const [nonStrikerId, setNonStrikerId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`ls-${matchId}-nonStriker`) || ""
    return ""
  })

  const [wicketType, setWicketType] = useState<string | null>(null)
  const [wicketBatsman, setWicketBatsman] = useState("")
  const [wicketFielder, setWicketFielder] = useState("")
  const [pendingExtraRuns, setPendingExtraRuns] = useState<number | null>(null)
  const [pendingExtraType, setPendingExtraType] = useState<string | null>(null)
  const [ballRegion, setBallRegion] = useState("")

  const [inningsNum, setInningsNum] = useState(1)
  const [endMatchConfirm, setEndMatchConfirm] = useState(false)
  const [endingMatch, setEndingMatch] = useState(false)
  const [tossWinner, setTossWinner] = useState("")
  const [tossDecision, setTossDecision] = useState("")
  const [tossOverrideOpen, setTossOverrideOpen] = useState(false)
  const [superOverT1Runs, setSuperOverT1Runs] = useState("")
  const [superOverT1Wkts, setSuperOverT1Wkts] = useState("")
  const [superOverT2Runs, setSuperOverT2Runs] = useState("")
  const [superOverT2Wkts, setSuperOverT2Wkts] = useState("")
  const [customHighlights, setCustomHighlights] = useState<{ icon: string; text: string; sub: string }[]>([])
  const [newHighlightIcon, setNewHighlightIcon] = useState("⭐")
  const [newHighlightText, setNewHighlightText] = useState("")
  const [newHighlightSub, setNewHighlightSub] = useState("")
  const [savingHighlights, setSavingHighlights] = useState(false)

  const [autoCompletePending, setAutoCompletePending] = useState(false)
  const [superOverRequired, setSuperOverRequired] = useState(false)
  const [superOverTie, setSuperOverTie] = useState(false)
  const [matchCompleted, setMatchCompleted] = useState(false)
  const [completedResult, setCompletedResult] = useState("")
  const [completedMotm, setCompletedMotm] = useState("")

  const [superOverMode, setSuperOverMode] = useState(false)
  const [superOverBattingTeamId, setSuperOverBattingTeamId] = useState("")
  const [superOverBowlerId, setSuperOverBowlerId] = useState("")
  const [superOverStrikerId, setSuperOverStrikerId] = useState("")
  const [superOverNonStrikerId, setSuperOverNonStrikerId] = useState("")
  const [superOverBalls, setSuperOverBalls] = useState<BallEvent[]>([])
  const [superOverWickets, setSuperOverWickets] = useState(0)
  const [superOverCompleted, setSuperOverCompleted] = useState(false)
  const [superOverNumber, setSuperOverNumber] = useState(1)
  const [superOverWicketType, setSuperOverWicketType] = useState<string | null>(null)
  const [superOverWicketBatsman, setSuperOverWicketBatsman] = useState("")
  const [superOverWicketFielder, setSuperOverWicketFielder] = useState("")
  const [superOverPendingExtraType, setSuperOverPendingExtraType] = useState<string | null>(null)
  const [superOverPendingExtraRuns, setSuperOverPendingExtraRuns] = useState<number | null>(null)
  const [superOverRegion, setSuperOverRegion] = useState("")
  const [superOverSubmitting, setSuperOverSubmitting] = useState(false)
  const [completedSuperOverInnings, setCompletedSuperOverInnings] = useState<Array<{
    superOverNumber: number
    teamId: string
    battingTeamId: string
    bowlingTeamId: string
    runs: number
    wickets: number
    balls: number
    extras: number
    ballsData: BallEvent[]
    isCompleted: boolean
    isWinner: boolean
    result: string
  }>>([])

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/summary?matchId=${matchId}`)
      if (res.ok) {
        const data: SummaryData = await res.json()
        setSummary(data)
        return data
      }
    } catch {}
    return undefined
  }, [matchId])

  const { online, pendingCount, syncing, progress, lastSynced, refreshCount } = useOfflineQueue(async () => {
    const data = await fetchSummary()
    if (data) checkAndAutoComplete(data)
  })

  const [syncFlash, setSyncFlash] = useState(false)
  useEffect(() => {
    if (lastSynced > 0) {
      setSyncFlash(true)
      const t = window.setTimeout(() => setSyncFlash(false), 3000)
      return () => window.clearTimeout(t)
    }
  }, [lastSynced])

  const queuedBalls = useMemo(() => loadOfflineQueue().filter((q) => q.matchId === matchId), [matchId, pendingCount])

  const mergedInnings = useMemo(() => {
    if (!summary) return []
    const teamIds = new Set(summary.innings.map((i) => i.teamId))
    const base = [...summary.innings]
    for (const q of queuedBalls) {
      if (!teamIds.has(q.battingTeamId)) {
        base.push({ id: "", matchId, teamId: q.battingTeamId, runs: 0, wickets: 0, balls: 0, extras: 0, ballsData: [] })
        teamIds.add(q.battingTeamId)
      }
    }
    return base.map((inn) => {
      const existingIds = new Set(inn.ballsData.map((b) => b.id).filter((id): id is string => !!id))
      const queued = queuedBalls.filter((q) => q.battingTeamId === inn.teamId && !existingIds.has(q.id))
      if (queued.length === 0) return inn
      const ballsData = [...inn.ballsData, ...queued.map((q) => q.ball as unknown as BallEvent)]
      let runs = inn.runs
      let balls = inn.balls
      let wickets = inn.wickets
      let extras = inn.extras
      for (const q of queued) {
        const b = q.ball as unknown as BallEvent
        runs += b.runs
        extras += (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0) + b.byes + b.legByes
        if (!b.isWide && !b.isNoBall) balls++
        if (b.wicket) wickets++
      }
      return { ...inn, ballsData, runs, balls, wickets, extras }
    })
  }, [summary, queuedBalls, matchId])

  const activeInnings = useMemo(
    () => mergedInnings.find((i) => i.teamId === battingTeamId) || null,
    [mergedInnings, battingTeamId]
  )

  const checkAndAutoComplete = useCallback(async (summaryData: SummaryData) => {
    if (summaryData.match.status === "completed" || matchCompleted || autoCompletePending) return
    const allInnings = summaryData.innings
    if (allInnings.length < 2) return

    const inn1 = allInnings.find((i) => i.teamId === summaryData.match.team1.id)
    const inn2 = allInnings.find((i) => i.teamId === summaryData.match.team2.id)
    if (!inn1 || !inn2) return

    const t1Total = inn1.runs + inn1.extras
    const t2Total = inn2.runs + inn2.extras

    const oversDone = inn2.balls >= MATCH_CONFIG.totalBalls
    const allOut = inn2.wickets >= MATCH_CONFIG.wicketsPerInnings
    const targetChased = t2Total > t1Total
    const isTied = t1Total === t2Total && (oversDone || allOut)

    if (!oversDone && !allOut && !targetChased) return

    setAutoCompletePending(true)

    try {
      const res = await fetch("/api/live/complete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      })
      const data = await res.json()

      if (data.complete) {
        setMatchCompleted(true)
        setCompletedResult(data.result)
        setCompletedMotm(data.manOfMatchName || "")
        await fetchSummary()
      } else if (data.superOverRequired) {
        setSuperOverRequired(true)
        setAutoCompletePending(false)
      } else if (data.superOverTie) {
        setSuperOverTie(true)
        setAutoCompletePending(false)
      } else {
        setAutoCompletePending(false)
      }
    } catch {
      setAutoCompletePending(false)
    }
  }, [matchId, matchCompleted, autoCompletePending, fetchSummary])

  const submitSuperOver = useCallback(async () => {
    setAutoCompletePending(true)
    try {
      const so1 = parseInt(superOverT1Runs) || 0
      const so1w = parseInt(superOverT1Wkts) || 0
      const so2 = parseInt(superOverT2Runs) || 0
      const so2w = parseInt(superOverT2Wkts) || 0

      const res = await fetch("/api/live/complete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          superOverT1Runs: so1,
          superOverT1Wkts: so1w,
          superOverT2Runs: so2,
          superOverT2Wkts: so2w,
          superOverInningsData: completedSuperOverInnings,
        }),
      })
      const data = await res.json()
      if (data.complete) {
        setMatchCompleted(true)
        setCompletedResult(data.result)
        setCompletedMotm(data.manOfMatchName || "")
        setSuperOverRequired(false)
        setSuperOverTie(false)
        setSuperOverMode(false)
        await fetchSummary()
      } else if (data.superOverTie) {
        setSuperOverTie(true)
        setSuperOverMode(false)
        setAutoCompletePending(false)
      } else {
        setAutoCompletePending(false)
      }
    } catch {
      setAutoCompletePending(false)
    }
  }, [matchId, superOverT1Runs, superOverT1Wkts, superOverT2Runs, superOverT2Wkts, fetchSummary, completedSuperOverInnings])

  const startSuperOver = useCallback((teamId: string) => {
    setSuperOverMode(true)
    setSuperOverBattingTeamId(teamId)
    setSuperOverBalls([])
    setSuperOverWickets(0)
    setSuperOverCompleted(false)
    setSuperOverStrikerId("")
    setSuperOverNonStrikerId("")
    setSuperOverBowlerId("")
    setSuperOverWicketType(null)
    setSuperOverWicketBatsman("")
    setSuperOverWicketFielder("")
    setSuperOverPendingExtraType(null)
    setSuperOverPendingExtraRuns(null)
    setSuperOverRegion("")
  }, [])

  const completeSuperOverInnings = useCallback(async (ballsOverride?: BallEvent[]) => {
    if (!summary) return
    const team = superOverBattingTeamId === summary.match.team1.id ? summary.match.team1 : summary.match.team2

    let soRuns = 0
    let soWkts = 0
    for (const b of (ballsOverride || superOverBalls)) {
      soRuns += b.runs
      if (b.isWide || b.isNoBall) soRuns += 1
      soRuns += b.byes + b.legByes
      if (b.wicket) soWkts++
    }

    if (superOverBattingTeamId === summary.match.team1.id) {
      setSuperOverT1Runs(String(soRuns))
      setSuperOverT1Wkts(String(soWkts))
    } else {
      setSuperOverT2Runs(String(soRuns))
      setSuperOverT2Wkts(String(soWkts))
    }

    const soLegalBalls = (ballsOverride || superOverBalls).filter(b => !b.isWide && !b.isNoBall).length
    const bowlingTeamId = superOverBattingTeamId === summary.match.team1.id ? summary.match.team2.id : summary.match.team1.id
    setCompletedSuperOverInnings(prev => [...prev, {
      superOverNumber,
      teamId: superOverBattingTeamId,
      battingTeamId: superOverBattingTeamId,
      bowlingTeamId,
      runs: soRuns,
      wickets: soWkts,
      balls: soLegalBalls,
      extras: (ballsOverride || superOverBalls).reduce((sum, b) => sum + (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0) + b.byes + b.legByes, 0),
      ballsData: ballsOverride || superOverBalls,
      isCompleted: true,
      isWinner: false,
      result: "",
    }])

    setSuperOverCompleted(true)
    setSuperOverMode(false)

    if (superOverBattingTeamId === summary.match.team1.id) {
      startSuperOver(summary.match.team2.id)
    }
  }, [summary, superOverBattingTeamId, superOverBalls, startSuperOver, superOverNumber])

  function addSuperOverBall(ball: BallEvent) {
    if (!superOverStrikerId || !superOverBowlerId) {
      alert("Select striker and bowler for Super Over")
      return
    }

    const legalBalls = superOverBalls.filter(b => !b.isWide && !b.isNoBall).length
    if (!ball.isWide && !ball.isNoBall && legalBalls >= MATCH_CONFIG.superOverBalls) return

    let wickets = superOverWickets
    if (ball.wicket) wickets++
    if (wickets > MATCH_CONFIG.superOverWickets) return

    const updatedBalls = [...superOverBalls, ball]
    setSuperOverBalls(updatedBalls)
    setSuperOverWickets(wickets)

    setSuperOverWicketType(null)
    setSuperOverWicketBatsman("")
    setSuperOverWicketFielder("")
    setSuperOverPendingExtraRuns(null)
    setSuperOverPendingExtraType(null)
    setSuperOverRegion("")

    const newLegalBalls = updatedBalls.filter(b => !b.isWide && !b.isNoBall).length
    const overDone = newLegalBalls >= MATCH_CONFIG.superOverBalls
    const allOut = wickets >= MATCH_CONFIG.superOverWickets

    if (overDone || allOut) {
      completeSuperOverInnings(updatedBalls)
      return
    }

    const isLegal = !ball.isWide && !ball.isNoBall
    if (ball.wicket) {
      setSuperOverStrikerId("")
    } else {
      const totalRuns = ball.runs + ball.byes + ball.legByes
      if (totalRuns % 2 === 1) {
        const tmp = superOverStrikerId
        setSuperOverStrikerId(superOverNonStrikerId)
        setSuperOverNonStrikerId(tmp)
      }
    }
  }

  const saveHighlights = useCallback(async (highlights: { icon: string; text: string; sub: string }[]) => {
    setSavingHighlights(true)
    try {
      await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: matchId, customHighlights: JSON.stringify(highlights) }),
      })
    } catch {}
    setSavingHighlights(false)
  }, [matchId])

  const addHighlight = useCallback(() => {
    if (!newHighlightText.trim()) return
    const updated = [...customHighlights, { icon: newHighlightIcon, text: newHighlightText.trim(), sub: newHighlightSub.trim() || "Manual" }]
    setCustomHighlights(updated)
    saveHighlights(updated)
    setNewHighlightText("")
    setNewHighlightSub("")
  }, [customHighlights, newHighlightIcon, newHighlightText, newHighlightSub, saveHighlights])

  const removeHighlight = useCallback((idx: number) => {
    const updated = customHighlights.filter((_, i) => i !== idx)
    setCustomHighlights(updated)
    saveHighlights(updated)
  }, [customHighlights, saveHighlights])

  useEffect(() => {
    fetchSummary().then(() => setLoading(false))
    function startPoll() {
      pollRef.current = setInterval(() => { if (!document.hidden) fetchSummary() }, 3000)
    }
    startPoll()
    const onVis = () => {
      if (document.hidden) { if (pollRef.current) clearInterval(pollRef.current) }
      else { if (pollRef.current) clearInterval(pollRef.current); startPoll() }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [fetchSummary])

  useEffect(() => {
    if (!summary) return
    if (summary.match.tossWinner && !tossWinner) setTossWinner(summary.match.tossWinner)
    if (summary.match.tossDecision && !tossDecision) setTossDecision(summary.match.tossDecision)
    if ((summary.match as any).customHighlights && customHighlights.length === 0) {
      try { setCustomHighlights(JSON.parse((summary.match as any).customHighlights)) } catch {}
    }
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
    if (battingTeamId) localStorage.setItem(`ls-${matchId}-bat`, battingTeamId)
    if (bowlingTeamId) localStorage.setItem(`ls-${matchId}-bowl`, bowlingTeamId)
    if (bowlerId) localStorage.setItem(`ls-${matchId}-bowler`, bowlerId)
    if (strikerId) localStorage.setItem(`ls-${matchId}-striker`, strikerId)
    if (nonStrikerId) localStorage.setItem(`ls-${matchId}-nonStriker`, nonStrikerId)
  }, [matchId, battingTeamId, bowlingTeamId, bowlerId, strikerId, nonStrikerId])

  useEffect(() => {
    setBowlerId("")
    setStrikerId("")
    setNonStrikerId("")
    localStorage.removeItem(`ls-${matchId}-bowler`)
    localStorage.removeItem(`ls-${matchId}-striker`)
    localStorage.removeItem(`ls-${matchId}-nonStriker`)
  }, [bowlingTeamId, battingTeamId])

  const ROLE_ORDER_BATTING: Record<string, number> = { "Batsman": 0, "Wicket-keeper": 1, "All-rounder": 2, "Bowler": 3 }
  const ROLE_ORDER_BOWLING: Record<string, number> = { "Bowler": 0, "All-rounder": 1, "Wicket-keeper": 2, "Batsman": 3 }

  const battingPlayers = useMemo(() => summary
    ? (battingTeamId === summary.match.team1.id
        ? [...summary.team1Players].sort((a, b) => (ROLE_ORDER_BATTING[a.role] ?? 9) - (ROLE_ORDER_BATTING[b.role] ?? 9))
        : [...summary.team2Players].sort((a, b) => (ROLE_ORDER_BATTING[a.role] ?? 9) - (ROLE_ORDER_BATTING[b.role] ?? 9)))
    : [], [summary, battingTeamId])

  const bowlingPlayers = useMemo(() => summary
    ? (bowlingTeamId === summary.match.team1.id
        ? [...summary.team1Players].sort((a, b) => (ROLE_ORDER_BOWLING[a.role] ?? 9) - (ROLE_ORDER_BOWLING[b.role] ?? 9))
        : [...summary.team2Players].sort((a, b) => (ROLE_ORDER_BOWLING[a.role] ?? 9) - (ROLE_ORDER_BOWLING[b.role] ?? 9)))
    : [], [summary, bowlingTeamId])

  const outBatsmen = useMemo(() => new Set<string>(
    activeInnings
      ? activeInnings.ballsData
          .filter((b) => b.wicket)
          .map((b) => b.wicketBatsman || b.striker)
      : []
  ), [activeInnings?.ballsData])

  const availableBattingPlayers = useMemo(() => battingPlayers.filter((p) => !outBatsmen.has(p.id) || p.id === strikerId || p.id === nonStrikerId), [battingPlayers, outBatsmen, strikerId, nonStrikerId])

  const getCurrentOverBalls = useCallback((balls: BallEvent[]): BallEvent[] => {
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
  }, [])

  const currentOverBalls = useMemo(() => activeInnings
    ? getCurrentOverBalls(activeInnings.ballsData)
    : [], [activeInnings?.ballsData, getCurrentOverBalls])

  const bowlerLegalBalls = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of activeInnings?.ballsData || []) {
      if (!b.isWide && !b.isNoBall) {
        map[b.bowler] = (map[b.bowler] || 0) + 1
      }
    }
    return map
  }, [activeInnings?.ballsData])

  const lastOverBowlerId: string | null = useMemo(() => {
    if (!activeInnings || activeInnings.ballsData.length === 0) return null
    const legalBalls = activeInnings.ballsData.filter((b) => !b.isWide && !b.isNoBall)
    const currentOverNum = Math.floor(legalBalls.length / 6)
    if (currentOverNum <= 0) return null
    const prevOverStart = (currentOverNum - 1) * 6
    if (legalBalls.length % 6 === 0) {
      return legalBalls[legalBalls.length - 1]?.bowler || null
    }
    return legalBalls[prevOverStart]?.bowler || null
  }, [activeInnings?.ballsData])
  const MAX_BOWLER_OVERS = 2

  const innings1 = useMemo(() => mergedInnings.find(
    (i) => i.teamId === (summary?.match.team1.id)
  ), [mergedInnings, summary])

  const innings2 = useMemo(() => mergedInnings.find(
    (i) => i.teamId === (summary?.match.team2.id)
  ), [mergedInnings, summary])

  const superOverLiveScore = useMemo(() => {
    if (!summary) return { battingTeamName: "", bowlingTeamName: "", runs: 0, wickets: 0, legalBalls: 0, ballsLeft: MATCH_CONFIG.superOverBalls, target: null as number | null, isSecondBatting: false, firstTeamScore: "" }
    const battingTeam = superOverBattingTeamId === summary.match.team1.id ? summary.match.team1 : summary.match.team2
    const bowlingTeam = superOverBattingTeamId === summary.match.team1.id ? summary.match.team2 : summary.match.team1
    let runs = 0, wickets = 0, legalBalls = 0
    for (const b of superOverBalls) {
      runs += b.runs
      if (b.isWide || b.isNoBall) runs += 1
      runs += b.byes + b.legByes
      if (b.wicket) wickets++
      if (!b.isWide && !b.isNoBall) legalBalls++
    }
    const ballsLeft = MATCH_CONFIG.superOverBalls - legalBalls
    const isSecondBatting = superOverBattingTeamId !== summary.match.team1.id
    let firstTeamScore = ""
    if (isSecondBatting) {
      const s1 = parseInt(superOverT1Runs) || 0
      const w1 = parseInt(superOverT1Wkts) || 0
      firstTeamScore = `${summary.match.team1.shortName}: ${s1}/${w1}`
    }
    const target = isSecondBatting ? (parseInt(superOverT1Runs) || 0) + 1 : null
    return { battingTeamName: battingTeam.shortName, bowlingTeamName: bowlingTeam.shortName, runs, wickets, legalBalls, ballsLeft, target, isSecondBatting, firstTeamScore }
  }, [summary, superOverBattingTeamId, superOverBalls, superOverT1Runs, superOverT1Wkts])

  const requiredRunRate = useMemo(() => {
    if (!summary || summary.innings.length <= 1) return null
    const firstInnings = summary.innings[0]
    const target = firstInnings.runs + firstInnings.extras + 1
    const remaining = MATCH_CONFIG.totalBalls - (activeInnings?.balls || 0)
    if (remaining <= 0) return 0
    return Number((((target - (activeInnings?.runs || 0) - (activeInnings?.extras || 0)) / remaining) * 6).toFixed(2))
  }, [summary, activeInnings?.runs, activeInnings?.extras, activeInnings?.balls])

  const currentRunRate = useMemo(() => {
    if (!activeInnings || activeInnings.balls === 0) return 0
    return Number((((activeInnings.runs + activeInnings.extras) / activeInnings.balls) * 6).toFixed(2))
  }, [activeInnings?.runs, activeInnings?.extras, activeInnings?.balls])

  const winProbability = useMemo(() => {
    if (!summary || !activeInnings || superOverMode || matchCompleted) return null
    const inn1 = summary.innings[0]
    if (!inn1) return null
    if (inningsNum === 1) {
      const ballsFaced = activeInnings.balls
      const projected = ballsFaced > 0 ? Math.round(((activeInnings.runs + activeInnings.extras) / ballsFaced) * MATCH_CONFIG.totalBalls) : 0
      const strength = Math.min(100, Math.max(0, 50 + (projected - 30) * 1.5))
      return { team1: Math.round(strength), team2: Math.round(100 - strength) }
    }
    if (inningsNum === 2) {
      const target = inn1.runs + inn1.extras + 1
      const isTeam1Batting = activeInnings.teamId === summary.match.team1.id
      const chasingTotal = activeInnings.runs + activeInnings.extras
      const needed = target - chasingTotal
      const ballsLeft = MATCH_CONFIG.totalBalls - activeInnings.balls
      const wktsLeft = MATCH_CONFIG.wicketsPerInnings - activeInnings.wickets
      if (ballsLeft <= 0 || wktsLeft <= 0) return null
      const reqRate = needed / ballsLeft
      const strength = Math.min(100, Math.max(0, 50 + (4 - reqRate) * 12 + (wktsLeft - 1) * 2))
      return isTeam1Batting
        ? { team1: Math.round(strength), team2: Math.round(100 - strength) }
        : { team1: Math.round(100 - strength), team2: Math.round(strength) }
    }
    return null
  }, [summary, activeInnings, inningsNum, superOverMode, matchCompleted])

  async function addBall(ball: BallEvent) {
    if (!battingTeamId || !strikerId || !bowlerId) {
      alert("Please select batting team, striker, and bowler")
      return
    }
    setSubmitting(true)

    const ballId = createBallId()
    const fullBall = { ...ball, id: ballId }

    const applyLocalState = () => {
      setWicketType(null)
      setWicketBatsman("")
      setWicketFielder("")
      setPendingExtraRuns(null)
      setPendingExtraType(null)
      setBallRegion("")
      const isLegal = !ball.isWide && !ball.isNoBall
      const legalBallsAfter = (activeInnings?.balls || 0) + (isLegal ? 1 : 0)
      const overComplete = isLegal && legalBallsAfter % 6 === 0
      if (ball.wicket) {
        if (overComplete) {
          setStrikerId(nonStrikerId)
          setNonStrikerId("")
        } else {
          setStrikerId("")
        }
      } else {
        const completedRuns = ball.runs + (ball.byes || 0) + (ball.legByes || 0)
        const oddRuns = completedRuns % 2 === 1
        if (oddRuns !== overComplete) {
          const tmp = strikerId
          setStrikerId(nonStrikerId)
          setNonStrikerId(tmp)
        }
      }
      if (overComplete) {
        setBowlerId("")
        localStorage.removeItem(`ls-${matchId}-bowler`)
      }
    }

    try {
      if (navigator.onLine) {
        const res = await fetch("/api/live/balls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, battingTeamId, ball: fullBall, ballId }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.error) alert(data.error)
          setSubmitting(false)
          return
        }
        applyLocalState()
        fetch("/api/live/sync-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        })
        await fetchSummary()
        const updatedSummary = await fetch(`/api/live/summary?matchId=${matchId}`).then(r => r.json()).catch(() => null)
        if (updatedSummary) checkAndAutoComplete(updatedSummary)
      } else {
        addToOfflineQueue({ id: ballId, matchId, battingTeamId, ball: fullBall })
        refreshCount()
        applyLocalState()
      }
    } catch {
      addToOfflineQueue({ id: ballId, matchId, battingTeamId, ball: fullBall })
      refreshCount()
      applyLocalState()
    }
    setSubmitting(false)
  }

  async function undoBall() {
    if (!activeInnings) return
    const lastBall = activeInnings.ballsData[activeInnings.ballsData.length - 1]
    if (!lastBall) return
    const prevStriker = lastBall.striker
    const prevNonStriker = lastBall.nonStriker
    const prevBowler = lastBall.bowler
    setSubmitting(true)

    if (!navigator.onLine) {
      const lastBallId = lastBall.id
      if (lastBallId && queuedBalls.some((q) => q.id === lastBallId)) {
        removeFromOfflineQueue(lastBallId)
        refreshCount()
        setStrikerId(prevStriker)
        setNonStrikerId(prevNonStriker)
        setBowlerId(prevBowler)
        localStorage.setItem(`ls-${matchId}-bowler`, prevBowler)
      } else {
        alert("Cannot undo offline: this ball is already saved online. Connect to internet to undo it.")
      }
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/live/balls/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inningsId: activeInnings.id, ballId: lastBall.id || undefined }),
      })
      if (res.ok) {
        setStrikerId(prevStriker)
        setNonStrikerId(prevNonStriker)
        setBowlerId(prevBowler)
        localStorage.setItem(`ls-${matchId}-bowler`, prevBowler)
        fetch("/api/live/sync-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        })
        await fetchSummary()
      }
    } catch {
      setSubmitting(false)
      return
    }
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
      setPendingExtraType(type)
      setPendingExtraRuns(null)
    } else {
      setPendingExtraType(type)
      setPendingExtraRuns(null)
    }
  }

  function handleExtraRuns(runs: number) {
    if (!pendingExtraType) return
    if (pendingExtraType === "wide" || pendingExtraType === "noball") {
      addBall({
        runs,
        extras: pendingExtraType,
        wicket: wicketType,
        bowler: bowlerId,
        striker: strikerId,
        nonStriker: nonStrikerId,
        wicketBatsman: wicketType ? (wicketBatsman || strikerId) : null,
        wicketFielder: wicketType ? wicketFielder : null,
        isWide: pendingExtraType === "wide",
        isNoBall: pendingExtraType === "noball",
        byes: 0,
        legByes: 0,
        region: ballRegion,
      })
    } else {
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
      let winnerTeamId: string | null = null
      if (t1Total > t2Total) {
        const diff = t1Total - t2Total
        result = `${match.team1.name} won by ${diff} run${diff !== 1 ? "s" : ""}`
        winnerTeamId = match.team1.id
      } else if (t2Total > t1Total) {
        const wktsLeft = MATCH_CONFIG.wicketsPerInnings - t2Wkts
        result = `${match.team2.name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`
        winnerTeamId = match.team2.id
      } else {
        const so1Runs = parseInt(superOverT1Runs) || 0
        const so2Runs = parseInt(superOverT2Runs) || 0
        const so1Wkts = parseInt(superOverT1Wkts) || 0
        const so2Wkts = parseInt(superOverT2Wkts) || 0
        if (so1Runs || so2Runs) {
          if (so1Runs > so2Runs) {
            result = `${match.team1.name} won the Super Over (${so1Runs}/${so1Wkts} - ${so2Runs}/${so2Wkts})`
            winnerTeamId = match.team1.id
          } else if (so2Runs > so1Runs) {
            result = `${match.team2.name} won the Super Over (${so2Runs}/${so2Wkts} - ${so1Runs}/${so1Wkts})`
            winnerTeamId = match.team2.id
          } else result = "Match Tied (Super Over tied again)"
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
          bps.bowlingRuns += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
          if (ball.isWide) bps.wides++
          if (ball.isNoBall) bps.noBalls++

          if (ball.isWide || ball.isNoBall) {
            ps.ballsFaced--
          }

          if (ball.wicket && ball.wicket !== "runout") {
            bps.bowlingWickets++
          }
          if (ball.wicket) {
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
          winnerTeamId,
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
  const rrr = requiredRunRate
  const crr = currentRunRate

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
            {!online && (
              <span className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                <CloudOff className="h-3.5 w-3.5" /> OFFLINE MODE
              </span>
            )}
            {pendingCount > 0 && !syncing && (
              <span className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
                Pending Sync: {pendingCount}
              </span>
            )}
            {syncing && progress && (
              <span className="flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing... {progress.done}/{progress.total}
              </span>
            )}
            {syncFlash && (
              <span className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                <CheckCircle className="h-3.5 w-3.5" /> Offline data synced
              </span>
            )}
          </div>
        </div>

        {matchCompleted && (
          <div className="mb-4 rounded-xl border-2 border-green-500/30 bg-green-500/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Match Completed!</h3>
            </div>
            <p className="text-sm text-[var(--foreground)] font-semibold mb-1">{completedResult}</p>
            {completedMotm && (
              <div className="flex items-center gap-2 mt-2 text-sm text-[var(--muted-foreground)]">
                <Trophy className="h-4 w-4 text-[var(--accent)]" />
                Man of the Match: <span className="font-semibold text-[var(--accent)]">{completedMotm}</span>
              </div>
            )}
            <button onClick={() => router.push("/admin/matches")}
              className="mt-3 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors">
              Back to Matches
            </button>
          </div>
        )}

        {autoCompletePending && !matchCompleted && (
          <div className="mb-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Completing match automatically...</p>
          </div>
        )}

        {superOverRequired && !matchCompleted && !superOverMode && !superOverCompleted && (
          <div className="mb-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-amber-600 dark:text-amber-400">Match Tied — Super Over {superOverNumber}!</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">Both teams scored the same. Click to start ball-by-ball Super Over scoring:</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button onClick={() => startSuperOver(summary.match.team1.id)}
                className="rounded-lg border-2 border-amber-500/30 bg-[var(--card)] p-4 hover:bg-amber-500/10 transition-colors text-center">
                <p className="font-bold text-[var(--foreground)]">{summary.match.team1.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Bat First in Super Over</p>
              </button>
              <button onClick={() => startSuperOver(summary.match.team2.id)}
                className="rounded-lg border-2 border-amber-500/30 bg-[var(--card)] p-4 hover:bg-amber-500/10 transition-colors text-center">
                <p className="font-bold text-[var(--foreground)]">{summary.match.team2.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Bat First in Super Over</p>
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Super Over rules: 1 over (6 balls), max 2 wickets. Higher score wins. If tied again → another Super Over.</p>
          </div>
        )}

        {superOverMode && !matchCompleted && summary && (
          <div className="mb-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🏏</span>
              <h2 className="text-lg font-black text-amber-600 dark:text-amber-400">
                SUPER OVER {superOverNumber > 1 ? `#${superOverNumber}` : ""}
              </h2>
              <span className="text-2xl">🏏</span>
            </div>

            {superOverLiveScore.isSecondBatting && (
              <div className="mb-3 rounded-lg bg-[var(--muted)] p-3 text-center">
                <p className="text-xs font-semibold text-[var(--muted-foreground)]">First Innings</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{superOverLiveScore.firstTeamScore}</p>
              </div>
            )}

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-center mb-3">
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">Batting</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">{superOverLiveScore.battingTeamName}</p>
              <p className="text-3xl font-black text-[var(--foreground)] mt-1">{superOverLiveScore.runs}/{superOverLiveScore.wickets}</p>
              {superOverLiveScore.target && superOverLiveScore.runs < superOverLiveScore.target && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Need {superOverLiveScore.target - superOverLiveScore.runs} from {superOverLiveScore.ballsLeft} {superOverLiveScore.ballsLeft === 1 ? "ball" : "balls"}
                </p>
              )}
              {superOverLiveScore.target && superOverLiveScore.runs >= superOverLiveScore.target && (
                <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                  Target achieved! {superOverLiveScore.bowlingTeamName} wins Super Over!
                </p>
              )}
              {!superOverLiveScore.target && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {superOverLiveScore.ballsLeft} {superOverLiveScore.ballsLeft === 1 ? "ball" : "balls"} remaining
                </p>
              )}
            </div>

            <div className="flex justify-center mb-3">
              <span className="rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
                {superOverLiveScore.legalBalls}/{MATCH_CONFIG.superOverBalls} balls | {superOverLiveScore.wickets}/{MATCH_CONFIG.superOverWickets} wkts
              </span>
            </div>

            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 justify-center">
              {superOverBalls.map((b, i) => {
                const d = ballDisplay(b)
                return (
                  <div key={i} className={`flex h-8 min-w-[2rem] flex-col items-center justify-center rounded px-1 text-xs font-bold ${d.color}`}>
                    <span>{d.text}</span>
                    {d.region && <span className="text-[8px] opacity-70">{d.region.slice(0, 3)}</span>}
                  </div>
                )
              })}
              {superOverBalls.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No balls yet</p>}
            </div>

            {summary && (
              <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Bowler</label>
                  <select value={superOverBowlerId} onChange={e => setSuperOverBowlerId(e.target.value)}
                    className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs">
                    <option value="">Select</option>
                    {(superOverBattingTeamId === summary.match.team1.id ? summary.team2Players : summary.team1Players)
                      .sort((a, b) => {
                        const roleOrder: Record<string, number> = { Bowler: 0, "All-rounder": 1, "Wicket-keeper": 2, Batsman: 3 }
                        return (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)
                      })
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Striker</label>
                  <select value={superOverStrikerId} onChange={e => setSuperOverStrikerId(e.target.value)}
                    className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs">
                    <option value="">Select</option>
                    {(superOverBattingTeamId === summary.match.team1.id ? summary.team1Players : summary.team2Players)
                      .filter(p => p.id !== superOverNonStrikerId)
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Non-Striker</label>
                  <select value={superOverNonStrikerId} onChange={e => setSuperOverNonStrikerId(e.target.value)}
                    className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs">
                    <option value="">Select</option>
                    {(superOverBattingTeamId === summary.match.team1.id ? summary.team1Players : summary.team2Players)
                      .filter(p => p.id !== superOverStrikerId)
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {superOverWicketType && (
              <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">WICKET: {superOverWicketType.toUpperCase()}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)]">Who is out?</label>
                    <select value={superOverWicketBatsman} onChange={e => setSuperOverWicketBatsman(e.target.value)}
                      className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs">
                      <option value="">Select</option>
                      {(superOverBattingTeamId === summary?.match.team1.id ? summary.team1Players : summary.team2Players)
                        .filter(p => p.id !== superOverStrikerId || !superOverStrikerId)
                        .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {(superOverWicketType === "caught" || superOverWicketType === "stumped" || superOverWicketType === "runout") && (
                    <div>
                      <label className="text-xs text-[var(--muted-foreground)]">{superOverWicketType === "caught" ? "Caught by?" : superOverWicketType === "stumped" ? "Stumped by?" : "Run out by?"}</label>
                      <select value={superOverWicketFielder} onChange={e => setSuperOverWicketFielder(e.target.value)}
                        className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs">
                        <option value="">Select fielder</option>
                        {(superOverBattingTeamId === summary?.match.team1.id ? summary.team2Players : summary.team1Players)
                          .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {superOverPendingExtraType && (
              <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{superOverPendingExtraType.toUpperCase()} — How many runs?</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(r => (
                    <button key={r} onClick={() => {
                      if (!superOverPendingExtraType || !superOverStrikerId || !superOverBowlerId) return
                      addSuperOverBall({
                        runs: 0, extras: superOverPendingExtraType, wicket: superOverWicketType,
                        bowler: superOverBowlerId, striker: superOverStrikerId, nonStriker: superOverNonStrikerId,
                        wicketBatsman: superOverWicketType ? (superOverWicketBatsman || superOverStrikerId) : null,
                        wicketFielder: superOverWicketType ? superOverWicketFielder : null,
                        isWide: false, isNoBall: false,
                        byes: superOverPendingExtraType === "bye" ? r : 0,
                        legByes: superOverPendingExtraType === "legbye" ? r : 0,
                        region: superOverRegion,
                      })
                    }} className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-600 hover:bg-amber-500/20">{r}</button>
                  ))}
                </div>
                <button onClick={() => { setSuperOverPendingExtraType(null); setSuperOverPendingExtraRuns(null) }} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">RUNS</span>
              {[0, 1, 2, 3, 4, 6].map(r => (
                <button key={r} disabled={superOverSubmitting || !superOverStrikerId || !superOverBowlerId}
                  onClick={() => {
                    if (superOverWicketType) {
                      addSuperOverBall({ runs: r, extras: null, wicket: superOverWicketType, bowler: superOverBowlerId, striker: superOverStrikerId, nonStriker: superOverNonStrikerId, wicketBatsman: superOverWicketType ? (superOverWicketBatsman || superOverStrikerId) : null, wicketFielder: superOverWicketType ? superOverWicketFielder : null, isWide: false, isNoBall: false, byes: 0, legByes: 0, region: superOverRegion })
                    } else {
                      addSuperOverBall({ runs: r, extras: null, wicket: null, bowler: superOverBowlerId, striker: superOverStrikerId, nonStriker: superOverNonStrikerId, wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0, region: superOverRegion })
                    }
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold disabled:opacity-30 ${
                    r === 0 ? "bg-[var(--muted)]" : r === 4 ? "bg-pink-500/10 text-pink-500" : r === 6 ? "bg-red-500/10 text-red-500" : "bg-[var(--accent)]/10 text-[var(--accent)]"
                  } hover:scale-105 transition-transform`}>{r}</button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">EXTRAS</span>
              <button disabled={superOverSubmitting || !superOverStrikerId || !superOverBowlerId}
                onClick={() => addSuperOverBall({ runs: 0, extras: "wide", wicket: null, bowler: superOverBowlerId, striker: superOverStrikerId, nonStriker: superOverNonStrikerId, wicketBatsman: null, wicketFielder: null, isWide: true, isNoBall: false, byes: 0, legByes: 0, region: "" })}
                className="flex h-10 items-center gap-1 rounded-lg bg-gray-500/10 px-3 text-xs font-bold disabled:opacity-30 hover:bg-gray-500/20"><Zap className="h-3 w-3" /> Wide</button>
              <button disabled={superOverSubmitting || !superOverStrikerId || !superOverBowlerId}
                onClick={() => addSuperOverBall({ runs: 0, extras: "noball", wicket: null, bowler: superOverBowlerId, striker: superOverStrikerId, nonStriker: superOverNonStrikerId, wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: true, byes: 0, legByes: 0, region: "" })}
                className="flex h-10 items-center gap-1 rounded-lg bg-gray-500/10 px-3 text-xs font-bold disabled:opacity-30 hover:bg-gray-500/20"><Zap className="h-3 w-3" /> No Ball</button>
              <button disabled={superOverSubmitting || !superOverStrikerId || !superOverBowlerId}
                onClick={() => setSuperOverPendingExtraType("bye")}
                className="flex h-10 items-center gap-1 rounded-lg bg-gray-600/10 px-3 text-xs font-bold text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-600/20">Bye</button>
              <button disabled={superOverSubmitting || !superOverStrikerId || !superOverBowlerId}
                onClick={() => setSuperOverPendingExtraType("legbye")}
                className="flex h-10 items-center gap-1 rounded-lg bg-gray-600/10 px-3 text-xs font-bold text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-600/20">Leg Bye</button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">WICKET</span>
              {["bowled", "caught", "lbw", "stumped", "runout", "hit wicket"].map(w => (
                <button key={w} disabled={superOverSubmitting || !superOverStrikerId || !superOverBowlerId}
                  onClick={() => setSuperOverWicketType(superOverWicketType === w ? null : w)}
                  className={`flex h-10 items-center gap-1 rounded-lg px-3 text-xs font-bold disabled:opacity-30 transition-all ${
                    superOverWicketType === w ? "bg-purple-600 text-white ring-2 ring-purple-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
                  }`}>{w.charAt(0).toUpperCase() + w.slice(1)}</button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setSuperOverMode(false)} className="rounded-lg bg-[var(--muted)] px-3 py-2 text-xs font-semibold hover:bg-[var(--muted)]/80 transition-colors">
                Cancel Super Over
              </button>
            </div>
          </div>
        )}

        {superOverCompleted && !matchCompleted && !superOverMode && (
          <div className="mb-4 rounded-xl border-2 border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="font-bold text-green-600 dark:text-green-400">Super Over Innings Complete!</p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              {summary?.match.team1.shortName}: {superOverT1Runs || 0}/{superOverT1Wkts || 0} | {summary?.match.team2.shortName}: {superOverT2Runs || 0}/{superOverT2Wkts || 0}
            </p>
            <button onClick={submitSuperOver} disabled={autoCompletePending}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
              {autoCompletePending ? "Completing..." : "Complete Match"}
            </button>
          </div>
        )}

        {superOverTie && !matchCompleted && (
          <div className="mb-4 rounded-xl border-2 border-red-500/30 bg-red-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-red-500" />
              <h3 className="font-bold text-red-600 dark:text-red-400">Super Over {superOverNumber} Tied!</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">Starting Super Over {superOverNumber + 1}...</p>
            <button onClick={() => {
              setSuperOverNumber(n => n + 1)
              setSuperOverTie(false)
              setSuperOverCompleted(false)
              setSuperOverRequired(true)
              setSuperOverBalls([])
              setSuperOverWickets(0)
              setSuperOverT1Runs("")
              setSuperOverT1Wkts("")
              setSuperOverT2Runs("")
              setSuperOverT2Wkts("")
            }} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
              Start Super Over {superOverNumber + 1}
            </button>
          </div>
        )}

        <div className="mb-4 rounded-xl border-2 border-[var(--accent)]/30 bg-[var(--card)] p-4">
          <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
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

        {summary.match.status === "live" && innings1 && (
          <div className="mb-4">
            <button
              onClick={async () => {
                const newVal = !summary.match.inningsBreak
                await fetch("/api/live/innings-break", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ matchId, inningsBreak: newVal }),
                })
                await fetchSummary()
              }}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                summary.match.inningsBreak
                  ? "border-amber-500/60 bg-amber-500/20 text-amber-600 animate-pulse"
                  : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              {summary.match.inningsBreak ? "⏸ INNINGS BREAK — Tap to Resume" : "▶ Start Innings Break"}
            </button>
          </div>
        )}

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
                {!(summary.match.tossWinner && summary.match.tossDecision) || tossOverrideOpen ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {tossOverrideOpen && (
                      <div className="col-span-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600">
                        OVERRIDE MODE — Toss locked hai, yeh change match started hone ke baad bhi force karega.
                      </div>
                    )}
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
                              body: JSON.stringify({ id: matchId, tossWinner, tossDecision, override: tossOverrideOpen }),
                            })
                            if (!res.ok) { alert("Failed to save toss — match started hone ke baad override use karo"); return }
                            await fetchSummary()
                            setTossOverrideOpen(false)
                          }}
                          disabled={!tossWinner || !tossDecision}
                          className="flex items-center gap-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-600 disabled:opacity-40"
                        >
                          {tossOverrideOpen ? "Save Override" : "Set Toss"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="col-span-2 flex items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                        {tossWinner === match.team1.id ? match.team1.name : match.team2.name} won the toss & elected to {tossDecision} first
                      </span>
                      <button
                        onClick={() => {
                          setTossWinner(summary.match.tossWinner || "")
                          setTossDecision(summary.match.tossDecision || "")
                          setTossOverrideOpen(true)
                        }}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 hover:bg-amber-500/20"
                      >
                        Override Toss
                      </button>
                    </div>
                  </div>
                  </div>
                )}
              </div>

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                    {bowlingPlayers.map((p) => {
                      const overs = Math.floor((bowlerLegalBalls[p.id] || 0) / 6)
                      const balls = (bowlerLegalBalls[p.id] || 0) % 6
                      const overLabel = overs > 0 ? ` (${overs}.${balls} ov)` : ""
                      const isLastOver = p.id === lastOverBowlerId
                      const isMaxed = (bowlerLegalBalls[p.id] || 0) >= MAX_BOWLER_OVERS * 6
                      const disabled = isLastOver || isMaxed
                      return (
                        <option key={p.id} value={disabled ? "" : p.id} disabled={disabled}>
                          {p.name}{overLabel}{isLastOver ? " ← prev" : ""}{isMaxed ? " (max)" : ""}
                        </option>
                      )
                    })}
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
                    {availableBattingPlayers.filter(p => p.id !== nonStrikerId).map((p) => (
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
                    {availableBattingPlayers.filter(p => p.id !== strikerId).map((p) => (
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
                        {availableBattingPlayers.map((p) => (
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

              {pendingExtraType && (pendingExtraType === "wide" || pendingExtraType === "noball") && (
                <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="mb-2 text-xs font-bold text-yellow-600">
                    {pendingExtraType === "wide" ? "WIDE" : "NO BALL"} — Runs off bat?
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 6].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleExtraRuns(r)}
                        disabled={submitting}
                        className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold disabled:opacity-50 ${
                          r === 0 ? "bg-[var(--muted)]" : r === 4 ? "bg-pink-500 text-white hover:bg-pink-600" : r === 6 ? "bg-red-500 text-white hover:bg-red-600" : "bg-yellow-500 text-white hover:bg-yellow-600"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                    {pendingExtraType === "noball" && (
                      <>
                        <div className="w-px bg-yellow-600/30 mx-1" />
                        <button
                          onClick={() => setPendingExtraType("nb-bye")}
                          disabled={submitting}
                          className="flex h-12 items-center gap-1 rounded-lg bg-gray-500 px-3 text-sm font-bold text-white hover:bg-gray-600 disabled:opacity-50"
                        >+ Bye</button>
                        <button
                          onClick={() => setPendingExtraType("nb-legbye")}
                          disabled={submitting}
                          className="flex h-12 items-center gap-1 rounded-lg bg-gray-500 px-3 text-sm font-bold text-white hover:bg-gray-600 disabled:opacity-50"
                        >+ Leg Bye</button>
                      </>
                    )}
                    <button
                      onClick={() => { setPendingExtraType(null); setPendingExtraRuns(null) }}
                      className="rounded-lg bg-[var(--muted)] px-4 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted-foreground)]/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {pendingExtraType && (pendingExtraType === "nb-bye" || pendingExtraType === "nb-legbye") && (
                <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <p className="mb-2 text-xs font-bold text-yellow-600">
                    NO BALL + {pendingExtraType === "nb-bye" ? "BYE" : "LEG BYE"} — How many runs?
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          if (!pendingExtraType) return
                          addBall({
                            runs: 0,
                            extras: "noball",
                            wicket: wicketType,
                            bowler: bowlerId,
                            striker: strikerId,
                            nonStriker: nonStrikerId,
                            wicketBatsman: wicketType ? (wicketBatsman || strikerId) : null,
                            wicketFielder: wicketType ? wicketFielder : null,
                            isWide: false,
                            isNoBall: true,
                            byes: pendingExtraType === "nb-bye" ? r : 0,
                            legByes: pendingExtraType === "nb-legbye" ? r : 0,
                            region: ballRegion,
                          })
                        }}
                        disabled={submitting}
                        className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500 text-lg font-bold text-white hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      onClick={() => { setPendingExtraType(null); setPendingExtraRuns(null) }}
                      className="rounded-lg bg-[var(--muted)] px-4 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted-foreground)]/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {pendingExtraType && pendingExtraType !== "wide" && pendingExtraType !== "noball" && pendingExtraType !== "nb-bye" && pendingExtraType !== "nb-legbye" && (
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
                  { type: "retired_hurt", label: "Ret Hurt" },
                  { type: "retired_out", label: "Ret Out" },
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

            {activeInnings && !superOverMode && !matchCompleted && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                {summary && summary.innings.length >= 2 && (() => {
                  const firstInnings = summary.innings[0]
                  const target = firstInnings.runs + firstInnings.extras + 1
                  return (
                    <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-center">
                      <p className="text-xs font-semibold text-amber-600">TARGET</p>
                      <p className="text-2xl font-black text-amber-600">{target}</p>
                      <p className="text-[10px] text-amber-600/70">Need {Math.max(0, target - (activeInnings.runs + activeInnings.extras))} runs from {Math.max(0, MATCH_CONFIG.totalBalls - activeInnings.balls)} balls</p>
                    </div>
                  )
                })()}
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
                {winProbability && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
                      <span>{summary.match.team1.shortName}</span>
                      <span>EST. WIN PROB</span>
                      <span>{summary.match.team2.shortName}</span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <div className="bg-blue-500" style={{ width: `${winProbability.team1}%` }} />
                      <div className="bg-red-500" style={{ width: `${winProbability.team2}%` }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs font-bold tabular-nums">
                      <span className="text-blue-500">{winProbability.team1}%</span>
                      <span className="text-red-500">{winProbability.team2}%</span>
                    </div>
                  </div>
                )}
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
                <div className="mb-3 max-h-40 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[500px] text-xs">
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
                          return p.id === strikerId || p.id === nonStrikerId || activeInnings.ballsData.some(
                            (b) => b.striker === p.id || b.nonStriker === p.id
                          )
                        })
                        .sort((a, b) => {
                          const aBatting = a.id === strikerId || a.id === nonStrikerId
                          const bBatting = b.id === strikerId || b.id === nonStrikerId
                          if (aBatting && !bBatting) return -1
                          if (!aBatting && bBatting) return 1
                          const aOut = outBatsmen.has(a.id)
                          const bOut = outBatsmen.has(b.id)
                          if (!aOut && bOut) return -1
                          if (aOut && !bOut) return 1
                          return 0
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
                          const isNonStrike = p.id === nonStrikerId && !isOut
                          return (
                            <tr key={p.id} className={`border-b border-[var(--border)] ${isOnStrike ? "bg-[var(--accent)]/10 font-bold" : isNonStrike ? "bg-green-500/5" : ""}`}>
                              <td className="py-1 text-left">
                                {p.name} {isOnStrike ? "*" : isNonStrike ? "•" : isOut ? "†" : ""}
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
                <div className="max-h-40 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[450px] text-xs">
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
                          p.id === bowlerId || activeInnings.ballsData.some((b) => b.bowler === p.id)
                        )
                        .map((p) => {
                          const balls = activeInnings.ballsData.filter(
                            (b) => b.bowler === p.id
                          )
                          const legalBalls = balls.filter(
                            (b) => !b.isWide && !b.isNoBall
                          ).length
                          const runsConceded = balls.reduce(
                            (s, b) => s + b.runs + (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0),
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
                ⭐ CUSTOM HIGHLIGHTS
              </p>
              {customHighlights.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {customHighlights.map((h, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--muted)] px-3 py-1.5">
          <div className="flex flex-wrap items-center justify-end gap-2">
                        <span>{h.icon}</span>
                        <div>
                          <p className="text-xs font-bold">{h.text}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">{h.sub}</p>
                        </div>
                      </div>
                      <button onClick={() => removeHighlight(i)} className="text-xs text-red-500 hover:text-red-700">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <select value={newHighlightIcon} onChange={(e) => setNewHighlightIcon(e.target.value)} className="w-12 rounded-lg border border-[var(--border)] bg-[var(--background)] px-1 py-1.5 text-xs">
                  <option>⭐</option><option>🏏</option><option>🎯</option><option>💥</option><option>🔥</option><option>⚡</option><option>🧤</option><option>🙌</option><option>👑</option><option>🏆</option>
                </select>
                <input value={newHighlightText} onChange={(e) => setNewHighlightText(e.target.value)} placeholder="Highlight text..." className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs" onKeyDown={(e) => e.key === "Enter" && addHighlight()} />
                <input value={newHighlightSub} onChange={(e) => setNewHighlightSub(e.target.value)} placeholder="Label" className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs" onKeyDown={(e) => e.key === "Enter" && addHighlight()} />
                <button onClick={addHighlight} disabled={!newHighlightText.trim() || savingHighlights} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {savingHighlights ? "..." : "Add"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                <Activity className="h-3 w-3" /> ALL BALLS
              </p>
              {activeInnings && activeInnings.ballsData.length > 0 ? (
                <div className="space-y-1.5">
                  {(() => {
                    const groups: { over: number; balls: typeof activeInnings.ballsData }[] = []
                    let legalCount = 0
                    let currentGroup: typeof activeInnings.ballsData = []
                    for (const ball of activeInnings.ballsData) {
                      const isLegal = !ball.isWide && !ball.isNoBall
                      if (isLegal && legalCount > 0 && legalCount % 6 === 0) {
                        groups.push({ over: groups.length, balls: currentGroup })
                        currentGroup = []
                      }
                      currentGroup.push(ball)
                      if (isLegal) legalCount++
                    }
                    if (currentGroup.length > 0) groups.push({ over: groups.length, balls: currentGroup })
                    return groups.map((g) => (
                      <div key={g.over} className="flex items-center gap-2">
                        <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-[var(--muted-foreground)]">
                          {g.over + 1}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {g.balls.map((ball, i) => {
                            const display = ballDisplay(ball)
                            return (
                              <span
                                key={i}
                                title={display.region || ""}
                                className={`relative flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${display.color}`}
                              >
                                {display.text}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()}
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
