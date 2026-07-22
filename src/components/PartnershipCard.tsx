"use client"

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

interface Inning {
  runs: number
  wickets: number
  balls: number
  extras: number
}

interface PartnershipEntry {
  wicketNum: number
  runs: number
  balls: number
  batsmen: string[]
}

function computeWicketPartnerships(
  ballsData: BallEvent[],
  battingPlayerMap: Record<string, string>
): PartnershipEntry[] {
  const partnerships: PartnershipEntry[] = []
  let currentRuns = 0
  let currentBalls = 0
  let currentBatsmen: Set<string> = new Set()
  let wicketsSoFar = 0

  for (const ball of ballsData) {
    if (ball.striker) currentBatsmen.add(ball.striker)
    if (ball.nonStriker) currentBatsmen.add(ball.nonStriker)

    const isLegal = !ball.isWide && !ball.isNoBall
    if (isLegal) currentBalls++
    currentRuns += ball.runs || 0

    if (ball.wicket) {
      wicketsSoFar++
      partnerships.push({
        wicketNum: wicketsSoFar,
        runs: currentRuns,
        balls: currentBalls,
        batsmen: [...currentBatsmen].map((id) => battingPlayerMap[id] || "Unknown"),
      })
      const outBatsman = ball.wicketBatsman || ball.striker || ""
      currentBatsmen.delete(outBatsman)
      currentRuns = 0
      currentBalls = 0
    }
  }

  if (currentBalls > 0 || currentRuns > 0) {
    partnerships.push({
      wicketNum: wicketsSoFar + 1,
      runs: currentRuns,
      balls: currentBalls,
      batsmen: [...currentBatsmen].map((id) => battingPlayerMap[id] || "Unknown"),
    })
  }

  return partnerships
}

function computeBattingContributions(
  ballsData: BallEvent[],
  battingPlayers: { id: string; name: string }[]
) {
  const stats: Record<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; dismissal: string }> = {}
  for (const p of battingPlayers) {
    stats[p.id] = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissal: "" }
  }

  for (const ball of ballsData) {
    const sid = ball.striker || ""
    if (sid && stats[sid]) {
      stats[sid].runs += ball.runs || 0
      if (!ball.isWide && !ball.isNoBall) stats[sid].balls++
      if (ball.runs === 4) stats[sid].fours++
      if (ball.runs === 6) stats[sid].sixes++
    }
    if (ball.wicket) {
      const dismissed = ball.wicketBatsman || ball.striker || ""
      if (dismissed && stats[dismissed]) {
        stats[dismissed].isOut = true
        stats[dismissed].dismissal = ball.wicket
      }
    }
  }

  return stats
}

function formatOvers(balls: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}`
}

const WK_COLORS = [
  "var(--accent)",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
]

export function PartnershipCard({
  ballsData,
  battingPlayers,
  battingTeam,
  inning,
}: {
  ballsData: BallEvent[]
  battingPlayers: { id: string; name: string }[]
  battingTeam: { name: string; shortName: string }
  inning: Inning
}) {
  if (!ballsData || ballsData.length === 0 || battingPlayers.length === 0) return null

  const playerMap: Record<string, string> = {}
  for (const p of battingPlayers) playerMap[p.id] = p.name

  const partnerships = computeWicketPartnerships(ballsData, playerMap)
  const contributions = computeBattingContributions(ballsData, battingPlayers)

  const batters = battingPlayers.filter((p) => contributions[p.id] && contributions[p.id].balls > 0)
  if (batters.length === 0) return null

  const totalRuns = batters.reduce((s, p) => s + contributions[p.id].runs, 0)
  const totalBalls = batters.reduce((s, p) => s + contributions[p.id].balls, 0)
  const totalFours = batters.reduce((s, p) => s + contributions[p.id].fours, 0)
  const totalSixes = batters.reduce((s, p) => s + contributions[p.id].sixes, 0)
  const maxPartnershipRuns = partnerships.length > 0 ? Math.max(...partnerships.map((p) => p.runs), 1) : 1
  const maxBatRuns = batters.length > 0 ? Math.max(...batters.map((p) => contributions[p.id].runs), 1) : 1

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-3 text-sm font-semibold">{battingTeam.shortName} Partnerships</h3>

      {partnerships.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">Wicket Partnerships</p>
          <div className="space-y-1.5">
            {partnerships.map((pw) => {
              const pct = (pw.runs / maxPartnershipRuns) * 100
              const colorIdx = (pw.wicketNum - 1) % WK_COLORS.length
              return (
                <div key={pw.wicketNum} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-[var(--muted-foreground)]">
                    {pw.wicketNum}th
                  </span>
                  <div className="relative h-5 min-w-[40px] flex-1 overflow-hidden rounded bg-[var(--muted)]">
                    <div
                      className="absolute inset-y-0 left-0 rounded transition-all"
                      style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: WK_COLORS[colorIdx] }}
                    />
                    <span className="relative z-10 flex h-full items-center px-1.5 text-[10px] font-bold text-white">
                      {pw.runs} ({pw.balls})
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate text-[9px] text-[var(--muted-foreground)]">
                    {pw.batsmen.join(" & ")}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted-foreground)]">Individual Contributions</p>
        <div className="space-y-1.5">
          {batters.map((p, i) => {
            const s = contributions[p.id]
            const pct = (s.runs / maxBatRuns) * 100
            return (
              <div key={p.id} className="flex items-center gap-2">
                <span className="min-w-[80px] truncate text-xs font-medium">{playerMap[p.id]}</span>
                <div className="relative h-4 min-w-[40px] flex-1 overflow-hidden rounded bg-[var(--muted)]">
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all"
                    style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: i === 0 ? "var(--accent)" : "#22c55e" }}
                  />
                  <span className="relative z-10 flex h-full items-center px-1 text-[10px] font-bold text-white">
                    {s.runs} ({s.balls})
                  </span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {s.fours > 0 && `${s.fours}×4 `}
                  {s.sixes > 0 && `${s.sixes}×6`}
                  {s.isOut ? "" : " *"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-lg font-bold">{totalRuns}</span>
          <span className="text-[var(--muted-foreground)]">runs</span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="font-semibold">{totalBalls}</span>
          <span className="text-[var(--muted-foreground)]">balls</span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span>{totalFours}×4, {totalSixes}×6</span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="font-mono">SR {totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : "-"}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span>RR {inning.balls > 0 ? ((inning.runs + inning.extras) / (inning.balls / 6)).toFixed(2) : "-"}</span>
          <span>|</span>
          <span>Extras: {inning.extras}</span>
          <span>|</span>
          <span>Total: {inning.runs + inning.extras}/{inning.wickets} ({formatOvers(inning.balls)} ov)</span>
        </div>
      </div>
    </div>
  )
}
