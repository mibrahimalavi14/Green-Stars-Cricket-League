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

interface WormChartProps {
  innings1: { ballsData: BallData[]; teamName: string; color: string }
  innings2: { ballsData: BallData[]; teamName: string; color: string }
  maxOvers?: number
}

interface OverPoint {
  over: number
  runs: number
  wickets: number
}

function computeOverData(ballsData: BallData[], maxOvers: number): OverPoint[] {
  const points: OverPoint[] = [{ over: 0, runs: 0, wickets: 0 }]
  let cumulativeRuns = 0
  let cumulativeWickets = 0
  let legalCount = 0

  for (const ball of ballsData) {
    const totalRuns = ball.runs + (ball.byes || 0) + (ball.legByes || 0) + (ball.overthrows || 0) + (ball.penaltyRuns || 0)
    cumulativeRuns += totalRuns
    if (ball.wicket) cumulativeWickets++
    if (!ball.isWide && !ball.isNoBall && !ball.deadBall) legalCount++

    if (legalCount % 6 === 0 && legalCount > 0) {
      points.push({ over: legalCount / 6, runs: cumulativeRuns, wickets: cumulativeWickets })
    }
  }

  if (legalCount % 6 !== 0) {
    points.push({ over: Math.ceil(legalCount / 6), runs: cumulativeRuns, wickets: cumulativeWickets })
  }

  while (points.length <= maxOvers) {
    const lastPoint = points[points.length - 1]
    points.push({ over: lastPoint.over + 1, runs: lastPoint.runs, wickets: lastPoint.wickets })
  }

  return points.slice(0, maxOvers + 1)
}

export function WormChart({ innings1, innings2, maxOvers = 4 }: WormChartProps) {
  const data = useMemo(() => {
    const i1 = computeOverData(innings1.ballsData, maxOvers)
    const i2 = computeOverData(innings2.ballsData, maxOvers)
    const maxRuns = Math.max(
      ...i1.map(p => p.runs),
      ...i2.map(p => p.runs),
      10
    )
    return { i1, i2, maxRuns }
  }, [innings1.ballsData, innings2.ballsData, maxOvers])

  const svgWidth = 600
  const svgHeight = 250
  const padding = { top: 20, right: 30, bottom: 35, left: 45 }
  const chartW = svgWidth - padding.left - padding.right
  const chartH = svgHeight - padding.top - padding.bottom

  function toX(over: number) { return padding.left + (over / maxOvers) * chartW }
  function toY(runs: number) { return padding.top + chartH - (runs / data.maxRuns) * chartH }

  function pathD(points: OverPoint[]) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.over).toFixed(1)},${toY(p.runs).toFixed(1)}`).join(" ")
  }

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((data.maxRuns / yTicks) * i))
  const xTicks = Array.from({ length: maxOvers + 1 }, (_, i) => i)

  return (
    <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-3 font-semibold text-sm">Run Rate Comparison</h3>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 260 }}>
        {yTickValues.map(v => (
          <g key={v}>
            <line x1={padding.left} y1={toY(v)} x2={svgWidth - padding.right} y2={toY(v)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={padding.left - 8} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}
        {xTicks.map(v => (
          <g key={v}>
            {v > 0 && <line x1={toX(v)} y1={padding.top} x2={toX(v)} y2={padding.top + chartH} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,4" />}
            <text x={toX(v)} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}

        <path d={pathD(data.i1)} fill="none" stroke={innings1.color} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={pathD(data.i2)} fill="none" stroke={innings2.color} strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6,3" />

        {data.i1.filter(p => p.over > 0 && p.over <= maxOvers).map((p, i) => (
          <circle key={`i1-${i}`} cx={toX(p.over)} cy={toY(p.runs)} r="3" fill={innings1.color} />
        ))}
        {data.i2.filter(p => p.over > 0 && p.over <= maxOvers).map((p, i) => (
          <circle key={`i2-${i}`} cx={toX(p.over)} cy={toY(p.runs)} r="3" fill={innings2.color} />
        ))}

        <text x={svgWidth / 2} y={svgHeight - 1} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">Overs</text>
      </svg>
      <div className="mt-2 flex items-center justify-center gap-6 text-xs">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 rounded" style={{ backgroundColor: innings1.color }} />
          {innings1.teamName}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 rounded" style={{ backgroundColor: innings2.color, backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, var(--background) 3px, var(--background) 6px)" }} />
          {innings2.teamName}
        </span>
      </div>
    </div>
  )
}
