"use client"

import { useState, useEffect, useRef } from "react"
import { RefreshCw } from "lucide-react"
import { getVenueMapsUrl } from "@/lib/utils"

interface LiveMatch {
  id: string
  team1: { id: string; name: string; shortName: string; logo: string; color: string }
  team2: { id: string; name: string; shortName: string; logo: string; color: string }
  team1Score: string
  team2Score: string
  status: string
  result: string
  venue: string
  innings: { id: string; teamId: string; runs: number; wickets: number; balls: number; extras: number; ballsData: string }[]
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
}

function parseBallsData(raw: string): (string | BallEvent)[] {
  try {
    const parsed = JSON.parse(raw || "[]")
    if (parsed.length === 0) return []
    if (typeof parsed[0] === "string") return parsed
    return parsed
  } catch {
    return []
  }
}

function getBallDisplay(ball: string | BallEvent): { text: string; color: string } {
  if (typeof ball === "string") {
    if (ball === "W") return { text: "W", color: "bg-purple-600 text-white" }
    if (ball === "4") return { text: "4", color: "bg-pink-500 text-white" }
    if (ball === "6") return { text: "6", color: "bg-red-500 text-white" }
    if (ball === "0") return { text: "0", color: "bg-[var(--muted)]" }
    return { text: ball, color: "bg-[var(--muted)]" }
  }
  if (ball.wicket) return { text: "W", color: "bg-purple-600 text-white" }
  if (ball.isWide) return { text: "Wd", color: "bg-gray-500 text-white" }
  if (ball.isNoBall) return { text: "Nb", color: "bg-gray-500 text-white" }
  if (ball.byes && ball.byes > 0) return { text: `${ball.byes}B`, color: "bg-gray-500 text-white" }
  if (ball.legByes && ball.legByes > 0) return { text: `${ball.legByes}LB`, color: "bg-gray-500 text-white" }
  const r = ball.runs || 0
  if (r === 0) return { text: "0", color: "bg-[var(--muted)]" }
  if (r === 1) return { text: "1", color: "bg-blue-500 text-white" }
  if (r === 2) return { text: "2", color: "bg-yellow-500 text-white" }
  if (r === 3) return { text: "3", color: "bg-orange-500 text-white" }
  if (r === 4) return { text: "4", color: "bg-pink-500 text-white" }
  if (r === 6) return { text: "6", color: "bg-red-500 text-white" }
  return { text: String(r), color: "bg-[var(--muted)]" }
}

function getBallLabel(ball: string | BallEvent): string {
  if (typeof ball === "string") {
    if (ball === "W") return "Wicket!"
    if (ball === "0") return "Dot ball"
    return `${ball} run${ball === "1" ? "" : "s"}`
  }
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

export function LiveScoreClient({
  liveMatch,
  upcomingMatches,
}: {
  liveMatch: LiveMatch | null
  upcomingMatches: UpcomingMatch[]
}) {
  const [match, setMatch] = useState<LiveMatch | null>(liveMatch)
  const [refreshing, setRefreshing] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  async function refreshScore() {
    try {
      const res = await fetch("/api/matches/live")
      if (res.ok) {
        const data = await res.json()
        setMatch(data)
      }
    } catch {}
    setRefreshing(false)
  }

  useEffect(() => {
    const interval = setInterval(refreshScore, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [match])

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-[var(--muted-foreground)]">No live match at the moment.</p>
        {upcomingMatches.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Upcoming Matches</h2>
            <div className="space-y-3 max-w-md mx-auto">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  {(match as any).matchNo > 0 && <div className="mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {(match as any).matchNo}</div>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {match.team1.logo && <img src={match.team1.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                       <span className="font-medium">{match.team1.name}</span>
                    </div>
                    <span className="text-xs text-[var(--accent)]">VS</span>
                    <div className="flex items-center gap-2">
                       <span className="font-medium">{match.team2.name}</span>
                      {match.team2.logo && <img src={match.team2.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                    </div>
                  </div>
                  <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{new Date(match.date).toLocaleDateString()} &middot; {(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const inn1 = match.innings.find((i) => i.teamId === match.team1.id)
  const inn2 = match.innings.find((i) => i.teamId === match.team2.id)
  const overs1 = inn1 ? `${Math.floor(inn1.balls / 6)}.${inn1.balls % 6}` : "0.0"
  const overs2 = inn2 ? `${Math.floor(inn2.balls / 6)}.${inn2.balls % 6}` : "0.0"
  const t1Total = inn1 ? inn1.runs + inn1.extras : 0
  const t2Total = inn2 ? inn2.runs + inn2.extras : 0

  const currentInn = match.innings.length > 0 ? match.innings[match.innings.length - 1] : null
  const allBalls = currentInn ? parseBallsData(currentInn.ballsData) : []

  function getCurrentOverBalls(balls: (string | BallEvent)[]): (string | BallEvent)[] {
    if (balls.length === 0) return []
    let legalCount = 0
    for (const b of balls) {
      if (typeof b === "string") {
        if (b !== "W" || true) legalCount++
      } else {
        if (!b.isWide && !b.isNoBall) legalCount++
      }
    }
    const inLastOver = legalCount % 6 || 6
    let count = 0
    let startIdx = balls.length
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]
      const isLegal = typeof b === "string" ? true : (!b.isWide && !b.isNoBall)
      if (isLegal) count++
      if (count === inLastOver) {
        startIdx = i
        break
      }
    }
    return balls.slice(startIdx)
  }

  const currentOverBalls = getCurrentOverBalls(allBalls)

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
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="font-semibold text-red-500">LIVE</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              {match.team1.logo && <img src={match.team1.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
               <p className="font-bold">{match.team1.name}</p>
            </div>
            <p className="text-3xl font-bold tabular-nums">{inn1 ? `${t1Total}/${inn1.wickets}` : match.team1Score || "-"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {inn1 ? `(${overs1} ov)` : "Yet to bat"}
            </p>
          </div>

          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
               <p className="font-bold">{match.team2.name}</p>
              {match.team2.logo && <img src={match.team2.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
            </div>
            <p className="text-3xl font-bold tabular-nums">{inn2 ? `${t2Total}/${inn2.wickets}` : match.team2Score || "-"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {inn2 ? `(${overs2} ov)` : match.innings.length > 0 ? "Yet to bat" : "Yet to bat"}
            </p>
          </div>
        </div>

        {match.result && (
          <p className="mt-4 text-center text-sm font-medium">{match.result}</p>
        )}
      </div>

      {currentOverBalls.length > 0 && (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)]">Current Over</h3>
          <div className="flex flex-wrap gap-2">
            {currentOverBalls.map((ball, i) => {
              const display = getBallDisplay(ball)
              return (
                <span
                  key={allBalls.indexOf(ball)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${display.color}`}
                >
                  {display.text}
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Ball-by-Ball Timeline</h3>
        {allBalls.length > 0 ? (
          <div
            ref={timelineRef}
            className="max-h-96 space-y-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
          >
            {(() => {
              let legalCount = 0
              let currentOver = 0
              const elements: React.ReactElement[] = []
              let overBalls: { ball: string | BallEvent; idx: number }[] = []

              function flushOver() {
                if (overBalls.length === 0) return
                const overNum = currentOver
                elements.push(
                  <div key={`over-${overNum}`} className="mb-2">
                    <p className="mb-1 text-[10px] font-semibold text-[var(--muted-foreground)]">
                      Over {overNum + 1}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {overBalls.map(({ ball, idx }) => {
                        const display = getBallDisplay(ball)
                        const label = getBallLabel(ball)
                        return (
                          <span
                            key={idx}
                            title={label}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${display.color}`}
                          >
                            {display.text}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
                overBalls = []
              }

              allBalls.forEach((ball, i) => {
                const isLegal = typeof ball === "string" ? true : (!ball.isWide && !ball.isNoBall)
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
            })()}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">No ball data yet.</p>
        )}
      </div>
    </div>
  )
}
