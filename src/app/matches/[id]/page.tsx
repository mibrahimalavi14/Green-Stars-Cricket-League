import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Match, Team, Inning, PlayerMatch, Player } from "@prisma/client"

type MatchWithRelations = Match & {
  team1: Team
  team2: Team
  season: { name: string }
  innings: Inning[]
  performances: (PlayerMatch & { player: Player })[]
}

export const revalidate = 30

function BattingTable({ performances, heading }: { performances: (PlayerMatch & { player: Player })[], heading?: string }) {
  const batters = performances.filter(p => p.ballsFaced > 0).sort((a, b) => b.battingRuns - a.battingRuns)
  if (batters.length === 0) return null
  return (
    <div className="mb-6">
      {heading && <h3 className="mb-2 font-semibold">{heading}</h3>}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="p-2 text-left">Batter</th>
              <th className="p-2 text-center">Runs</th>
              <th className="p-2 text-center">Balls</th>
              <th className="p-2 text-center">4s</th>
              <th className="p-2 text-center">6s</th>
              <th className="p-2 text-center">SR</th>
            </tr>
          </thead>
          <tbody>
            {batters.map(p => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="p-2 font-medium">
                  <Link href={`/players/${p.playerId}`} className="hover:text-[var(--accent)] underline underline-offset-2">
                    {p.player.name}
                  </Link>
                  {!p.isOut && p.ballsFaced > 0 && <span className="ml-1 text-xs text-[var(--muted-foreground)]">*</span>}
                  {p.isOut && p.dismissalType && (
                    <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">({p.dismissalType})</span>
                  )}
                </td>
                <td className="p-2 text-center font-bold">{p.battingRuns}</td>
                <td className="p-2 text-center">{p.ballsFaced}</td>
                <td className="p-2 text-center text-blue-600 dark:text-blue-400">{p.fours}</td>
                <td className="p-2 text-center text-purple-600 dark:text-purple-400">{p.sixes}</td>
                <td className="p-2 text-center font-mono">{p.ballsFaced > 0 ? ((p.battingRuns / p.ballsFaced) * 100).toFixed(1) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BowlingTable({ performances, heading }: { performances: (PlayerMatch & { player: Player })[], heading?: string }) {
  const bowlers = performances.filter(p => p.ballsBowled > 0).sort((a, b) => b.bowlingWickets - a.bowlingWickets)
  if (bowlers.length === 0) return null
  return (
    <div className="mb-6">
      {heading && <h3 className="mb-2 font-semibold">{heading}</h3>}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="p-2 text-left">Bowler</th>
              <th className="p-2 text-center">Overs</th>
              <th className="p-2 text-center">Mdns</th>
              <th className="p-2 text-center">Runs</th>
              <th className="p-2 text-center">Wkts</th>
              <th className="p-2 text-center">Econ</th>
            </tr>
          </thead>
          <tbody>
            {bowlers.map(p => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="p-2 font-medium">
                  <Link href={`/players/${p.playerId}`} className="hover:text-[var(--accent)] underline underline-offset-2">
                    {p.player.name}
                  </Link>
                </td>
                <td className="p-2 text-center font-mono">{Math.floor(p.ballsBowled / 6)}.{p.ballsBowled % 6}</td>
                <td className="p-2 text-center">{p.maidens}</td>
                <td className="p-2 text-center">{p.bowlingRuns}</td>
                <td className="p-2 text-center font-bold text-green-600 dark:text-green-400">{p.bowlingWickets}</td>
                <td className="p-2 text-center font-mono">{p.ballsBowled > 0 ? (p.bowlingRuns / (p.ballsBowled / 6)).toFixed(2) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PartnershipCard({ battingPerformances, inning }: { battingPerformances: (PlayerMatch & { player: Player })[], inning: Inning | undefined }) {
  const batters = battingPerformances.filter(p => p.ballsFaced > 0)
  if (batters.length === 0) return null
  const totalRuns = batters.reduce((s, p) => s + p.battingRuns, 0)
  const totalBalls = batters.reduce((s, p) => s + p.ballsFaced, 0)
  const totalFours = batters.reduce((s, p) => s + p.fours, 0)
  const totalSixes = batters.reduce((s, p) => s + p.sixes, 0)
  return (
    <div className="mb-8">
      <h3 className="mb-2 font-semibold">Partnership</h3>
      <div className="rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between gap-4">
          {batters.map((p, i) => (
            <div key={p.id} className={`flex flex-col ${i === 0 ? "items-start" : "items-end"}`}>
              <Link href={`/players/${p.playerId}`} className="text-sm font-medium hover:text-[var(--accent)] underline underline-offset-2">
                {p.player.name}
              </Link>
              <span className="text-sm text-[var(--muted-foreground)]">{p.battingRuns} ({p.ballsFaced})</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-[var(--border)] pt-3 text-center">
          <span className="text-xl font-bold">{totalRuns}</span>
          <span className="mx-1.5 text-xs text-[var(--muted-foreground)]">runs off</span>
          <span className="text-base font-semibold">{totalBalls}</span>
          <span className="mx-1.5 text-xs text-[var(--muted-foreground)]">balls</span>
          <span className="text-xs text-[var(--muted-foreground)]">
            ({totalFours}×4, {totalSixes}×6) &middot; SR {totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : "-"}
          </span>
        </div>
        {inning && (
          <div className="mt-1 text-center text-xs text-[var(--muted-foreground)]">
            Extras: {inning.extras} &middot; Total: {inning.runs}/{inning.wickets} ({Math.floor(inning.balls / 6)}.{inning.balls % 6} overs)
          </div>
        )}
      </div>
    </div>
  )
}

async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      team1: true,
      team2: true,
      season: true,
      innings: true,
      performances: { include: { player: true } },
    },
  })
  if (!match) notFound()

  const m: MatchWithRelations = match
  const team1Performances = m.performances.filter(p => p.teamId === m.team1Id)
  const team2Performances = m.performances.filter(p => p.teamId === m.team2Id)
  const team1Inning = m.innings.find(i => i.teamId === m.team1Id)
  const team2Inning = m.innings.find(i => i.teamId === m.team2Id)

  const team1BatFirst = team1Inning && team2Inning
    ? m.innings[0]?.teamId === m.team1Id
    : true

  const firstBattingTeam = team1BatFirst ? m.team1 : m.team2
  const firstBowlingTeam = team1BatFirst ? m.team2 : m.team1
  const firstBattingPerf = team1BatFirst ? team1Performances : team2Performances
  const firstBowlingPerf = team1BatFirst ? team2Performances : team1Performances
  const firstInning = team1BatFirst ? team1Inning : team2Inning

  const secondBattingTeam = team1BatFirst ? m.team2 : m.team1
  const secondBowlingTeam = team1BatFirst ? m.team1 : m.team2
  const secondBattingPerf = team1BatFirst ? team2Performances : team1Performances
  const secondBowlingPerf = team1BatFirst ? team1Performances : team2Performances
  const secondInning = team1BatFirst ? team2Inning : team1Inning

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/seasons/${m.seasonId}`} className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">
        &larr; Back to Season
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold">
          {m.matchNo > 0 && <span>Match {m.matchNo} — </span>}
          {m.team1.name} vs {m.team2.name}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {m.season.name} &middot;{" "}
          {new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })} &middot;{" "}
          {m.venue}
        </p>
      </div>

      {m.status === "upcoming" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="text-lg font-semibold">Match yet to begin</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Scheduled for {new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      )}

      {m.status === "live" && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center dark:border-green-800/40 dark:bg-green-900/10">
          <p className="text-lg font-bold text-green-700 dark:text-green-400">Live</p>
        </div>
      )}

      {(m.status === "completed" || m.status === "live") && (
        <>
          {m.tossWinner && (
            <p className="mb-4 text-sm text-[var(--muted-foreground)]">
              Toss: {m.tossWinner} elected to {m.tossDecision} first
            </p>
          )}

          {/* Score summary cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className={`rounded-xl border p-4 ${team1BatFirst ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
              <div className="mb-2 flex items-center gap-2">
                {m.team1.logo && <img src={m.team1.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                <span className="font-semibold">{m.team1.name}</span>
              </div>
              <p className="text-2xl font-bold">{team1Inning ? `${team1Inning.runs}/${team1Inning.wickets}` : "-"}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {team1Inning ? `${Math.floor(team1Inning.balls / 6)}.${team1Inning.balls % 6} overs` : "-"}
              </p>
              {team1Inning && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Extras: <span className="font-medium">{team1Inning.extras}</span>
                </p>
              )}
            </div>

            <div className={`rounded-xl border p-4 ${!team1BatFirst ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
              <div className="mb-2 flex items-center gap-2">
                {m.team2.logo && <img src={m.team2.logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
                <span className="font-semibold">{m.team2.name}</span>
              </div>
              <p className="text-2xl font-bold">{team2Inning ? `${team2Inning.runs}/${team2Inning.wickets}` : "-"}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {team2Inning ? `${Math.floor(team2Inning.balls / 6)}.${team2Inning.balls % 6} overs` : "-"}
              </p>
              {team2Inning && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Extras: <span className="font-medium">{team2Inning.extras}</span>
                </p>
              )}
            </div>
          </div>

          {m.result && (
            <p className="mb-6 text-sm font-medium text-green-600 dark:text-green-400">{m.result}</p>
          )}

          {m.manOfMatch && (
            <p className="mb-6 text-sm">
              Player of the Match: <span className="font-semibold">{m.manOfMatch}</span>
            </p>
          )}

          <h2 className="mb-6 text-lg font-bold text-center">Scorecard</h2>

          {/* 1st Innings */}
          <div className="mb-8 rounded-xl border-2 border-[var(--accent)] p-4">
            <h2 className="mb-4 text-lg font-bold">{firstBattingTeam.name} Innings</h2>
            {BattingTable({ performances: firstBattingPerf, heading: "Batting" })}
            {BowlingTable({ performances: firstBowlingPerf, heading: "Bowling" })}
            {PartnershipCard({ battingPerformances: firstBattingPerf, inning: firstInning })}
          </div>

          {/* 2nd Innings */}
          <div className="mb-8 rounded-xl border-2 border-[var(--border)] p-4">
            <h2 className="mb-4 text-lg font-bold">{secondBattingTeam.name} Innings</h2>
            {BattingTable({ performances: secondBattingPerf, heading: "Batting" })}
            {BowlingTable({ performances: secondBowlingPerf, heading: "Bowling" })}
            {PartnershipCard({ battingPerformances: secondBattingPerf, inning: secondInning })}
          </div>

          {m.youtubeUrl && (
            <div className="mt-6">
              <a href={m.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Watch on YouTube
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MatchDetailPage
