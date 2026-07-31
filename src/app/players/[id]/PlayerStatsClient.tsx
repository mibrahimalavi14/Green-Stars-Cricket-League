"use client"

import { useState } from "react"
import Link from "next/link"
import { ShareButtons } from "@/components/ShareButtons"
import { Trophy, Zap, Target, Star, Medal, ArrowUp, CircleDot } from "lucide-react"

type PerfMin = { battingRuns: number; ballsFaced: number; fours: number; sixes: number; isOut: boolean; wicketsLost: number; dismissalType: string; secondDismissalType: string; bowlingWickets: number; bowlingRuns: number; ballsBowled: number; catches: number; dismissedByBowlerId: string; dismissedByFielderId: string; secondDismissedByBowlerId: string; secondDismissedByFielderId: string; match: { id: string; team1: { logo: string; shortName: string }; team2: { logo: string; shortName: string }; seasonId: string; date: string } }
type SeasonStat = { seasonId: string; seasonName: string; seasonYear: number; inns: number; runs: number; ballsFaced: number; wickets: number; ballsBowled: number; runsConceded: number; fours: number; sixes: number; dismissals: number; catches: number; stumpings: number; hs: number }

export function PlayerStatsClient({ player, performances, seasonStats, activePerfs, transfers }: { player: any; performances: PerfMin[]; seasonStats: SeasonStat[]; activePerfs: PerfMin[]; transfers: any[] }) {
  const [view, setView] = useState<string>("all")

  const p = player
  const selPerfs = view === "all" ? performances : view === "latest" ? activePerfs : performances.filter(x => x.match.seasonId === view)
  const selStat = view === "all" ? null : view === "latest" ? seasonStats.find(s => s.seasonId === p.team?.seasonId) || seasonStats[0] : seasonStats.find(s => s.seasonId === view)

  const inns = selPerfs.length
  const dismissals = selPerfs.filter(x => x.isOut).length
  const runs = selPerfs.reduce((a, x) => a + x.battingRuns, 0)
  const ballsFaced = selPerfs.reduce((a, x) => a + x.ballsFaced, 0)
  const wickets = selPerfs.reduce((a, x) => a + x.bowlingWickets, 0)
  const ballsBowled = selPerfs.reduce((a, x) => a + x.ballsBowled, 0)
  const runsConceded = selPerfs.reduce((a, x) => a + x.bowlingRuns, 0)
  const fours = selPerfs.reduce((a, x) => a + x.fours, 0)
  const sixes = selPerfs.reduce((a, x) => a + x.sixes, 0)
  const catches = selPerfs.reduce((a, x) => a + x.catches, 0)
  const fifties = selPerfs.filter(x => x.battingRuns >= 50 && x.battingRuns < 100).length
  const hundreds = selPerfs.filter(x => x.battingRuns >= 100).length
  const ducks = selPerfs.filter(x => x.battingRuns === 0 && x.isOut).length
  const threes = selPerfs.reduce((a, x) => a + (x as any).threes || 0, 0)
  const dotBalls = selPerfs.reduce((a, x) => a + (x as any).dotBalls || 0, 0)
  const maidens = selPerfs.reduce((a, x) => a + (x as any).maidens || 0, 0)
  const wides = selPerfs.reduce((a, x) => a + (x as any).wides || 0, 0)
  const noBalls = selPerfs.reduce((a, x) => a + (x as any).noBalls || 0, 0)
  const fiveWickets = selPerfs.filter(x => x.bowlingWickets >= 5).length
  const fourWickets = selPerfs.filter(x => x.bowlingWickets >= 4).length
  const hattricks = selPerfs.reduce((a, x) => a + ((x as any).hattricks || 0), 0)
  const timesBowled = selPerfs.filter(x => x.dismissalType === "bowled" || x.secondDismissalType === "bowled").length
  const timesCaught = selPerfs.filter(x => x.dismissalType === "caught" || x.secondDismissalType === "caught").length
  const timesLbw = selPerfs.filter(x => x.dismissalType === "lbw" || x.secondDismissalType === "lbw").length
  const timesStumped = selPerfs.filter(x => x.dismissalType === "stumped" || x.secondDismissalType === "stumped").length
  const timesRunOut = selPerfs.filter(x => x.dismissalType === "runout" || x.secondDismissalType === "runout").length

  const battingAvg = dismissals > 0 ? (runs / dismissals).toFixed(2) : "-" 
  const sr = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(2) : "-"
  const econ = ballsBowled > 0 ? (runsConceded / (ballsBowled / 6)).toFixed(2) : "-"
  const bowlingAvg = wickets > 0 ? (runsConceded / wickets).toFixed(2) : "-"
  const battingSr = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(2) : "-"
  const overs = Math.floor(ballsBowled / 6) + "." + (ballsBowled % 6)
  const hsPerf = selPerfs.reduce((best, x) => x.battingRuns > (best?.battingRuns ?? -1) ? x : best, null as PerfMin | null)
  const hs = hsPerf ? hsPerf.battingRuns : 0
  const hsDisplay = hsPerf && !hsPerf.isOut && hsPerf.ballsFaced > 0 ? `${hs}*` : String(hs)
  const ballsPerBoundary = (fours + sixes) > 0 ? (ballsFaced / (fours + sixes)).toFixed(1) : "-"
  const bowlingSr = wickets > 0 ? (ballsBowled / wickets).toFixed(2) : "-"
  const wktsPerMatch = selPerfs.length > 0 ? (wickets / selPerfs.length).toFixed(2) : "-"
  const boundaryPct = runs === 0 ? "0" : (((fours * 4 + sixes * 6) / runs) * 100).toFixed(1)
  const dotBallPct = ballsFaced === 0 ? "0" : ((dotBalls / ballsFaced) * 100).toFixed(1)
  const bestBbiWkts = Math.max(...selPerfs.map(x => x.bowlingWickets), 0)
  const bestBbiCandidates = selPerfs.filter(x => x.bowlingWickets === bestBbiWkts)
  const bestBbiRuns = bestBbiCandidates.sort((a, b) => a.bowlingRuns - b.bowlingRuns)[0]?.bowlingRuns || 0
  const bestBbiBalls = bestBbiCandidates.sort((a, b) => (a.ballsBowled || 0) - (b.ballsBowled || 0))[0]?.ballsBowled || 0
  const bestBbiOvers = bestBbiBalls > 0 ? ` (${Math.floor(bestBbiBalls / 6)}.${bestBbiBalls % 6})` : ""

  const tabs = [
    { id: "all", label: "All Time" },
    ...(activePerfs.length > 0 ? [{ id: "latest", label: "Current Season" }] : []),
    ...seasonStats.map(s => ({ id: s.seasonId, label: `${s.seasonName} (${s.seasonYear})` })),
  ]
  if (tabs.length > 5) {
    tabs.splice(5, tabs.length - 5, { id: "more", label: "More..." })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-8">
        <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {p.photo && p.photo !== "/placeholder-player.svg" ? (
            <img src={p.photo} alt={p.name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <img src="/placeholder-player.svg" alt={p.name} className="h-24 w-24 rounded-full bg-[var(--muted)] p-4" />
          )}
          <div>
            <h1 className="text-3xl font-bold">{p.name}</h1>
            {p.jerseyNumber != null && <span className="ml-2 text-sm font-semibold text-[var(--muted-foreground)]">#{p.jerseyNumber}</span>}
            {p.status && p.status !== "available" && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                p.status === "injured" ? "bg-red-500/15 text-red-500"
                : p.status === "suspended" ? "bg-orange-500/15 text-orange-500"
                : "bg-slate-500/15 text-slate-400"
              }`}>{p.status}</span>
            )}
            <p className="text-lg text-[var(--muted-foreground)]">
              {p.role} &middot;
              {p.team?.logo && <img src={p.team.logo} alt="" className="mr-1 inline-block h-6 w-6 rounded-full object-cover" />}
              {p.team?.name}
            </p>
            <div className="mt-1">
              <ShareButtons url={`/players/${p.id}`} title={`${p.name} - ${p.role} - GSCL`} />
            </div>
            <div className="mt-1 text-sm text-[var(--muted-foreground)]">
              <span>Bat: {p.battingStyle}</span>
              {(p.role === "All-rounder" || p.role === "Bowler") && <span className="ml-4">Bowl: {p.bowlingStyle}</span>}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === t.id ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--muted)] hover:bg-[var(--muted)]/70"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Batting {selStat && <span className="text-sm font-normal text-[var(--muted-foreground)]">({selStat.seasonName} {selStat.seasonYear})</span>}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <StatCard label="Matches" value={selPerfs.length} />
            <StatCard label="Innings" value={inns} />
            <StatCard label="Runs" value={runs} />
            <StatCard label="HS" value={hsDisplay} />
            <StatCard label="Avg" value={battingAvg} />
            <StatCard label="SR" value={sr} />
            <StatCard label="4s" value={fours} />
            <StatCard label="6s" value={sixes} />
            <StatCard label="3s" value={threes} />
            <StatCard label="Dot Balls" value={dotBalls} />
            <StatCard label="Dot%" value={dotBallPct} />
            <StatCard label="Boundary%" value={boundaryPct} />
            <StatCard label="Fifties" value={fifties} />
            <StatCard label="100s" value={hundreds} />
            <StatCard label="Not Outs" value={selPerfs.filter(x => !x.isOut && x.ballsFaced > 0).length} />
            <StatCard label="Ducks" value={ducks} />
            <StatCard label="Balls/B" value={ballsPerBoundary} />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Bowling {selStat && <span className="text-sm font-normal text-[var(--muted-foreground)]">({selStat.seasonName} {selStat.seasonYear})</span>}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <StatCard label="Matches" value={selPerfs.length} />
            <StatCard label="Innings" value={selPerfs.filter(x => x.ballsBowled > 0).length} />
            <StatCard label="Overs" value={overs} />
            <StatCard label="Maidens" value={maidens} />
            <StatCard label="Wickets" value={wickets} />
            <StatCard label="Runs" value={runsConceded} />
            <StatCard label="Wides" value={wides} />
            <StatCard label="No Balls" value={noBalls} />
            <StatCard label="BBI" value={`${bestBbiWkts}/${bestBbiRuns}`} title={`${bestBbiWkts}/${bestBbiRuns}${bestBbiOvers}`} />
            <StatCard label="SR" value={bowlingSr} />
            <StatCard label="Avg" value={bowlingAvg} />
            <StatCard label="Econ" value={econ} />
            <StatCard label="5w" value={fiveWickets} />
            <StatCard label="4w" value={fourWickets} />
            <StatCard label="Hattricks" value={hattricks} />
            <StatCard label="Wkts/M" value={wktsPerMatch} />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Fielding {selStat && <span className="text-sm font-normal text-[var(--muted-foreground)]">({selStat.seasonName} {selStat.seasonYear})</span>}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <StatCard label="Catches" value={catches} />
            <StatCard label="Stumpings" value={selPerfs.reduce((a, x) => a + (x as any).stumpings || 0, 0)} />
            <StatCard label="Run Outs" value={selPerfs.reduce((a, x) => a + (x as any).runOuts || 0, 0)} />
            <StatCard label="Bowled" value={timesBowled} />
            <StatCard label="Caught" value={timesCaught} />
            <StatCard label="LBW" value={timesLbw} />
            <StatCard label="Stumped" value={timesStumped} />
            <StatCard label="Run Out" value={timesRunOut} />
          </div>
        </div>

        <CareerMilestones player={p} />
      </div>

      {performances.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Form Guide — Last 5</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {performances.slice(0, 5).map((p, i) => {
              const isGood = p.battingRuns >= 20 || p.bowlingWickets >= 2
              const isAvg = p.battingRuns >= 10 || p.bowlingWickets >= 1
              const isOut = p.wicketsLost > 0 || p.isOut
              return (
                <div key={i} className="flex h-14 w-14 flex-col items-center justify-center rounded-lg border text-xs font-bold"
                  style={{
                    backgroundColor: isGood ? "var(--accent)" : isAvg ? "orange" : "var(--muted)",
                    color: isGood || isAvg ? "white" : "var(--foreground)",
                    borderColor: isGood ? "var(--accent)" : isAvg ? "orange" : "var(--border)",
                  }}
                  title={`${p.battingRuns} runs, ${p.bowlingWickets} wkts ${!isOut ? "(not out)" : ""}`}>
                  <span>{p.battingRuns}</span>
                  <span className="text-[10px] opacity-80">{isOut ? "●" : "○"}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2 pl-2 text-[11px] text-[var(--muted-foreground)]">
              <span className="inline-block h-3 w-3 rounded bg-[var(--accent)]" /> Good
              <span className="inline-block h-3 w-3 rounded bg-orange-500" /> Avg
              <span className="inline-block h-3 w-3 rounded bg-[var(--muted)]" /> Poor
              <span className="ml-2">● Out</span>
              <span>○ Not out</span>
            </div>
          </div>

          <h2 className="mb-4 text-xl font-semibold">Match Log</h2>
          <div className="space-y-3">
            {performances.map((p) => (
              <div key={p.match.id + p.battingRuns + p.bowlingWickets} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    {p.match.team1.logo && <img src={p.match.team1.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                    {p.match.team1.shortName}
                    <span className="text-[var(--muted-foreground)]">vs</span>
                    {p.match.team2.shortName}
                    {p.match.team2.logo && <img src={p.match.team2.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                  </span>
                  <span className="text-[var(--muted-foreground)]">{new Date(p.match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Bat: </span>
                    <span className="font-medium">{p.battingRuns}</span>
                    <span className="text-[var(--muted-foreground)]"> ({p.ballsFaced} balls, {p.fours}×4, {p.sixes}×6)</span>
                    {(() => { const wk = p.wicketsLost || 0; if (wk === 0 && p.ballsFaced > 0) return <span className="text-green-500"> not out</span>; if (p.dismissalType) return <span className="text-red-500"> {p.dismissalType}{wk > 1 ? ` (${wk}w)` : ""}</span>; return null; })()}
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Bowl: </span>
                    <span className="font-medium">{p.bowlingWickets}/{p.bowlingRuns}</span>
                    <span className="text-[var(--muted-foreground)]"> ({p.ballsBowled} balls)</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Catches: </span>
                    <span className="font-medium">{p.catches}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <h2 className="mb-4 text-lg font-semibold">Transfer History</h2>
          <div className="space-y-3">
            {transfers.map(t => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                <div className="flex items-center gap-2">
                  {t.fromTeam ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-[var(--muted)] px-2.5 py-1 text-sm font-medium">
                      {t.fromTeam.logo && <img src={t.fromTeam.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                      {t.fromTeam.name}
                    </span>
                  ) : <span className="rounded-lg bg-[var(--muted)] px-2.5 py-1 text-sm text-[var(--muted-foreground)]">New entry</span>}
                  <ArrowUp className="h-4 w-4 rotate-90 text-[var(--accent)]" />
                  <span className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/10 px-2.5 py-1 text-sm font-semibold text-[var(--accent)]">
                    {t.toTeam?.logo && <img src={t.toTeam.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                    {t.toTeam?.name || "Unknown"}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {t.season?.name} &middot; {new Date(t.transferDate).toLocaleDateString("en-GB")}
                  {t.reason && <span className="ml-2 italic">{t.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, title }: { label: string; value: string | number; title?: string }) {
  return (
    <div className="rounded-lg bg-[var(--muted)] p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)]" title={title || label}>{label}</p>
    </div>
  )
}

function CareerMilestones({ player }: { player: any }) {
  const milestones = [
    { name: "1000 Runs", current: player.runs, target: 1000, icon: Trophy, color: "text-yellow-400" },
    { name: "500 Runs", current: player.runs, target: 500, icon: Trophy, color: "text-yellow-400" },
    { name: "100 Fours", current: player.fours, target: 100, icon: Zap, color: "text-cyan-400" },
    { name: "50 Sixes", current: player.sixes, target: 50, icon: Zap, color: "text-purple-400" },
    { name: "100 Wickets", current: player.wickets, target: 100, icon: Target, color: "text-red-400" },
    { name: "50 Wickets", current: player.wickets, target: 50, icon: Target, color: "text-red-400" },
    { name: "50 Catches", current: player.catches, target: 50, icon: Star, color: "text-green-400" },
    { name: "10 Fifties", current: player.fifties, target: 10, icon: Medal, color: "text-orange-400" },
    { name: "5 Hundreds", current: player.hundreds, target: 5, icon: Medal, color: "text-yellow-400" },
    { name: "50 Matches", current: player.matchesPlayed, target: 50, icon: Trophy, color: "text-blue-400" },
  ]

  return (
    <div className="mt-8 border-t border-[var(--border)] pt-6">
      <h2 className="mb-4 text-lg font-semibold">Career Milestones</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((m) => {
          const pct = Math.min((m.current / m.target) * 100, 100)
          const achieved = m.current >= m.target
          const Icon = m.icon
          return (
            <div key={m.name} className={`rounded-lg border p-4 transition-all ${achieved ? "border-green-500/30 bg-green-900/10" : "border-[var(--border)] bg-[var(--muted)]"}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${achieved ? "text-green-400" : m.color}`} />
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                {achieved && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Achieved!
                  </span>
                )}
              </div>
              <div className="mb-1 flex items-baseline justify-between text-xs text-[var(--muted-foreground)]">
                <span>{m.current} / {m.target}</span>
                <span>{pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--background)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${achieved ? "bg-green-500" : "bg-[var(--accent)]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
