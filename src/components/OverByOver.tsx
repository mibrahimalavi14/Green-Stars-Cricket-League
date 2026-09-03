"use client"

import { useMemo } from "react"

interface BallData {
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
  deadBall?: boolean
  overthrows?: number
  penaltyRuns?: number
}

interface OverByOverProps {
  ballsData: BallData[]
  teamName: string
}

function isLegalDelivery(ball: BallData): boolean {
  return !ball.isWide && !ball.isNoBall && !ball.deadBall
}

function ballDisplay(ball: BallData): { text: string; color: string; isWicket: boolean } {
  if (ball.deadBall && !ball.penaltyRuns) {
    return { text: "DB", color: "#64748b", isWicket: false }
  }
  if (ball.wicket) {
    const wkTypes: Record<string, string> = {
      bowled: "W", caught: "W", lbw: "W", stumped: "W", runout: "W-RO", "hit wicket": "W-HW",
      retired_hurt: "RH", retired_out: "W-RO",
    }
    return { text: wkTypes[ball.wicket] || "W", color: "#ef4444", isWicket: true }
  }
  if (ball.isWide) {
    const r = ball.runs
    return { text: r > 0 ? `Wd+${r}` : "Wd", color: "#f59e0b", isWicket: false }
  }
  if (ball.isNoBall) {
    const r = ball.runs
    return { text: r > 0 ? `NB+${r}` : "NB", color: "#f59e0b", isWicket: false }
  }
  const ov = ball.overthrows || 0
  const pen = ball.penaltyRuns || 0
  const total = ball.runs + (ball.byes || 0) + (ball.legByes || 0) + ov + pen
  const suffix = (ball.byes || 0) > 0 ? "b" : (ball.legByes || 0) > 0 ? "lb" : ""
  if (pen > 0) return { text: `P${pen}`, color: "#6366f1", isWicket: false }
  const label = suffix + (ov > 0 ? `+${ov}O` : "")
  if (total === 0) return { text: "·", color: "var(--muted-foreground)", isWicket: false }
  if (total === 4) return { text: `${total}${label}`, color: "#22c55e", isWicket: false }
  if (total === 6) return { text: `${total}${label}`, color: "#3b82f6", isWicket: false }
  return { text: `${total}${label}`, color: "var(--foreground)", isWicket: false }
}

export function OverByOver({ ballsData, teamName }: OverByOverProps) {
  const overs = useMemo(() => {
    const result: { overNum: number; balls: ReturnType<typeof ballDisplay>[]; runs: number; wickets: number; extras: number }[] = []
    let currentOver: ReturnType<typeof ballDisplay>[] = []
    let overNum = 1
    let overRuns = 0
    let overWickets = 0
    let overExtras = 0
    let legalCount = 0

    for (const ball of ballsData) {
      const display = ballDisplay(ball)
      currentOver.push(display)
      const totalRuns = ball.runs + (ball.byes || 0) + (ball.legByes || 0) + (ball.overthrows || 0) + (ball.penaltyRuns || 0)
      overRuns += totalRuns
      if (ball.wicket) overWickets++
      if (ball.isWide || ball.isNoBall) overExtras++
      if (isLegalDelivery(ball)) legalCount++

      if (legalCount === 6 || (ball.wicket && legalCount >= 6)) {
        result.push({ overNum, balls: currentOver, runs: overRuns, wickets: overWickets, extras: overExtras })
        currentOver = []
        overNum++
        overRuns = 0
        overWickets = 0
        overExtras = 0
        legalCount = 0
      }
    }

    if (currentOver.length > 0) {
      result.push({ overNum, balls: currentOver, runs: overRuns, wickets: overWickets, extras: overExtras })
    }

    return result
  }, [ballsData])

  if (overs.length === 0) return null

  const totalRuns = overs.reduce((s, o) => s + o.runs, 0)
  const totalWickets = overs.reduce((s, o) => s + o.wickets, 0)

  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Over-by-Over: {teamName}</h3>
        <span className="text-xs text-[var(--muted-foreground)]">{totalRuns}/{totalWickets}</span>
      </div>
      <div className="space-y-2">
        {overs.map(over => (
          <div key={over.overNum} className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-right text-xs font-bold text-[var(--muted-foreground)]">
              {over.overNum}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {over.balls.map((b, i) => (
                <span key={i}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold ${
                    b.isWicket ? "bg-red-500/20 text-red-500 ring-1 ring-red-500/30" :
                    b.text === "·" ? "bg-[var(--muted)] text-[var(--muted-foreground)]" :
                    b.text.startsWith("4") || b.text === "4b" || b.text === "4lb" ? "bg-green-500/20 text-green-500" :
                    b.text.startsWith("6") || b.text === "6b" || b.text === "6lb" ? "bg-blue-500/20 text-blue-500" :
                    b.text.includes("Wd") || b.text.includes("NB") ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-[var(--muted)]"
                  }`}
                  style={!b.isWicket && b.text !== "·" && !b.text.includes("Wd") && !b.text.includes("NB") ? { color: b.color } : undefined}
                >
                  {b.text}
                </span>
              ))}
            </div>
            <span className="ml-auto shrink-0 text-xs text-[var(--muted-foreground)]">
              {over.runs}r {over.wickets > 0 && <span className="text-red-500">{over.wickets}w</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-[var(--border)] pt-2 flex items-center gap-4 text-[10px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-green-500" /> 4s</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-blue-500" /> 6s</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-500" /> Wickets</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-yellow-500" /> Extras</span>
      </div>
    </div>
  )
}
