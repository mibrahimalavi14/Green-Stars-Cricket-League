import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Match, Team, Inning, PlayerMatch, Player } from "@prisma/client"
import { H2H } from "@/components/H2H"
import { ShareButtons } from "@/components/ShareButtons"
import { Star } from "lucide-react"

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : url
}

type Perf = PlayerMatch & { player: Player }

type MatchWithRelations = Match & {
  team1: Team
  team2: Team
  season: { name: string }
  innings: Inning[]
  performances: Perf[]
}

export const revalidate = 30

function bowlerShort(style: string) {
  const map: Record<string, string> = {
    "Right-arm fast": "RAF",
    "Right-arm fast-medium": "RAF-M",
    "Right-arm medium": "RAM",
    "Left-arm fast": "LAF",
    "Left-arm fast-medium": "LAF-M",
    "Left-arm medium": "LAM",
    "Right-arm off break": "OB",
    "Left-arm orthodox": "LAO",
    "Leg break googly": "LBG",
    "Slow left-arm chinaman": "SLA",
    "Right-arm leg break": "LB",
  }
  return map[style] || style
}

function dismissText(p: Perf, allPerfs: Perf[], type: string, bowlerId: string, fielderId: string) {
  if (!type) return ""
  const bowlerName = bowlerId ? allPerfs.find(pp => pp.playerId === bowlerId)?.player.name : null
  const fielderName = fielderId ? allPerfs.find(pp => pp.playerId === fielderId)?.player.name : null
  const bn = bowlerName || ""
  const fn = fielderName || ""
  switch (type) {
    case "bowled": return `b ${bn}`
    case "caught": return `c ${fn} b ${bn}`
    case "lbw": return `lbw b ${bn}`
    case "stumped": return `st ${fn} b ${bn}`
    case "run out": return `run out (${fn || bn})`
    case "hit wicket": return `hit wicket b ${bn}`
    case "retired": return "retired hurt"
    default: return type
  }
}

function getDismissalText(p: Perf, allPerfs: Perf[]) {
  const wk = (p as any).wicketsLost || (p.isOut ? 1 : 0)
  if (wk === 0) return p.ballsFaced > 0 ? "not out" : ""
  const parts: string[] = []
  if (wk >= 1 && p.dismissalType) parts.push(dismissText(p, allPerfs, p.dismissalType, p.dismissedByBowlerId, p.dismissedByFielderId))
  if (wk >= 2 && (p as any).secondDismissalType) parts.push(dismissText(p, allPerfs, (p as any).secondDismissalType, (p as any).secondDismissedByBowlerId, (p as any).secondDismissedByFielderId))
  return parts.join(", ")
}

function BattingTable({ performances, allPerformances, heading }: { performances: Perf[], allPerformances: Perf[], heading?: string }) {
  const batters = performances.filter(p => p.ballsFaced > 0).sort((a, b) => b.battingRuns - a.battingRuns)
  if (batters.length === 0) return null
  return (
    <div className="mb-6">
      {heading && <h3 className="mb-2 font-semibold">{heading}</h3>}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[450px] text-sm">
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
            {batters.map(p => {
              const dismissText = getDismissalText(p, allPerformances)
              return (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="p-2 font-medium">
                    <Link href={`/players/${p.playerId}`} className="hover:text-[var(--accent)] underline underline-offset-2">
                      {p.player.name}
                    </Link>
                    {p.player.battingStyle && (
                      <span className="ml-1 rounded bg-[var(--muted)] px-1 text-[9px] font-medium text-[var(--muted-foreground)]">
                        {p.player.battingStyle === "Left-handed" ? "LHB" : "RHB"}
                      </span>
                    )}
                    {dismissText && (
                      <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">
                        {dismissText === "not out" ? "*" : `(${dismissText})`}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center font-bold">{p.battingRuns}</td>
                  <td className="p-2 text-center">{p.ballsFaced}</td>
                  <td className="p-2 text-center text-blue-600 dark:text-blue-400">{p.fours}</td>
                  <td className="p-2 text-center text-purple-600 dark:text-purple-400">{p.sixes}</td>
                  <td className="p-2 text-center font-mono">{p.ballsFaced > 0 ? ((p.battingRuns / p.ballsFaced) * 100).toFixed(1) : "-"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BowlingTable({ performances, heading }: { performances: Perf[], heading?: string }) {
  const bowlers = performances.filter(p => p.ballsBowled > 0).sort((a, b) => b.bowlingWickets - a.bowlingWickets)
  if (bowlers.length === 0) return null
  return (
    <div className="mb-6">
      {heading && <h3 className="mb-2 font-semibold">{heading}</h3>}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="p-2 text-left">Bowler</th>
              <th className="p-2 text-center">Overs</th>
              <th className="p-2 text-center">Mdns</th>
              <th className="p-2 text-center">Runs</th>
              <th className="p-2 text-center">Wkts</th>
              <th className="p-2 text-center">Wd</th>
              <th className="p-2 text-center">Nb</th>
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
                  {p.player.bowlingStyle && (
                    <span className="ml-1 rounded bg-[var(--muted)] px-1 text-[9px] font-medium text-[var(--muted-foreground)]">
                      {bowlerShort(p.player.bowlingStyle)}
                    </span>
                  )}
                </td>
                <td className="p-2 text-center font-mono">{Math.floor(p.ballsBowled / 6)}.{p.ballsBowled % 6}</td>
                <td className="p-2 text-center">{p.maidens}</td>
                <td className="p-2 text-center">{p.bowlingRuns}</td>
                <td className="p-2 text-center font-bold text-green-600 dark:text-green-400">{p.bowlingWickets}</td>
                <td className="p-2 text-center text-orange-600 dark:text-orange-400">{p.wides || "-"}</td>
                <td className="p-2 text-center text-rose-600 dark:text-rose-400">{p.noBalls || "-"}</td>
                <td className="p-2 text-center font-mono">{p.ballsBowled > 0 ? (p.bowlingRuns / (p.ballsBowled / 6)).toFixed(2) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PartnershipCard({ battingPerformances, allPerformances, inning }: { battingPerformances: Perf[], allPerformances: Perf[], inning: Inning | undefined }) {
  const batters = battingPerformances.filter(p => p.ballsFaced > 0)
  if (batters.length === 0) return null
  const totalRuns = batters.reduce((s, p) => s + p.battingRuns, 0)
  const totalBalls = batters.reduce((s, p) => s + p.ballsFaced, 0)
  const totalFours = batters.reduce((s, p) => s + p.fours, 0)
  const totalSixes = batters.reduce((s, p) => s + p.sixes, 0)
  const maxRuns = Math.max(...batters.map(p => p.battingRuns), 1)
  return (
    <div className="mb-8">
      <h3 className="mb-2 font-semibold">Partnership</h3>
      <div className="rounded-xl border border-[var(--border)] p-4">
        {batters.map((p, i) => {
          const pct = (p.battingRuns / totalRuns) * 100
          return (
            <div key={p.id} className="mb-2">
              <div className="mb-1 flex items-center justify-between text-sm">
                <Link href={`/players/${p.playerId}`} className="font-medium hover:text-[var(--accent)] underline underline-offset-2">
                  {p.player.name}
                </Link>
                <span className="text-[var(--muted-foreground)]">
                  {p.battingRuns} ({p.ballsFaced}){p.isOut ? ` ${getDismissalText(p, allPerformances)}` : " *"}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: i === 0 ? "var(--accent)" : "#22c55e",
                  }}
                />
              </div>
            </div>
          )
        })}
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-center gap-2 text-sm">
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
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span>RR {inning && inning.balls > 0 ? (inning.runs / (inning.balls / 6)).toFixed(2) : "-"}</span>
            {inning && (
              <>
                <span>|</span>
                <span>Extras: {inning.extras}</span>
                <span>|</span>
                <span>Total: {inning.runs}/{inning.wickets} ({Math.floor(inning.balls / 6)}.{inning.balls % 6} ov)</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FallOfWickets({ battingPerformances, allPerformances, inning }: { battingPerformances: Perf[], allPerformances: Perf[], inning: Inning | undefined }) {
  const outPlayers = battingPerformances.filter(p => p.isOut)
  if (outPlayers.length === 0) return null
  return (
    <div className="mb-6">
      <h3 className="mb-2 font-semibold">Fall of Wickets</h3>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="p-2 text-center">Wkt</th>
              <th className="p-2 text-left">Batter</th>
              <th className="p-2 text-left">Dismissal</th>
              <th className="p-2 text-center">Runs</th>
            </tr>
          </thead>
          <tbody>
            {outPlayers.map((p, idx) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="p-2 text-center font-bold text-[var(--muted-foreground)]">{idx + 1}</td>
                <td className="p-2 font-medium">
                  <Link href={`/players/${p.playerId}`} className="hover:text-[var(--accent)] underline underline-offset-2">
                    {p.player.name}
                  </Link>
                </td>
                <td className="p-2 text-xs text-[var(--muted-foreground)]">{getDismissalText(p, allPerformances)}</td>
                <td className="p-2 text-center font-semibold">{p.battingRuns}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

  const squad = await prisma.squadMember.findMany({
    where: { matchId: id },
    include: { player: { select: { name: true, role: true, photo: true } } },
  })

  const m: MatchWithRelations = match
  const allPerfs = m.performances
  const team1Performances = allPerfs.filter(p => p.teamId === m.team1Id)
  const team2Performances = allPerfs.filter(p => p.teamId === m.team2Id)
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
        <div className="flex items-center gap-2 mb-1">
          {m.stage !== "league" && (
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
              m.stage === "final" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
              m.stage === "qualifier1" || m.stage === "qualifier2" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {m.stage === "qualifier1" ? "Qualifier 1" :
               m.stage === "qualifier2" ? "Qualifier 2" :
               m.stage === "eliminator" ? "Eliminator" :
               m.stage === "final" ? "Final" : m.stage}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold">
          {m.matchNo > 0 && <span>Match {m.matchNo} — </span>}
          {m.team1.name} vs {m.team2.name}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {m.season.name} &middot;{" "}
          {new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })} &middot;{" "}
          {m.venue}
        </p>
        <div className="mt-2">
          <ShareButtons url={`/matches/${m.id}`} title={`${m.team1.name} vs ${m.team2.name} - ${m.season.name}`} />
        </div>
      </div>

      <H2H team1Id={m.team1Id} team2Id={m.team2Id} matchId={m.id} />

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

          {squad.length > 0 && (
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="mb-3 text-sm font-semibold">Playing XI</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {squad.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    {s.player.photo && s.player.photo !== "/placeholder-player.svg"
                      ? <img src={s.player.photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                      : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-bold">{s.player.name.charAt(0)}</div>}
                    <span>{s.player.name}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{s.player.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <p className="mb-4 text-sm">
              Player of the Match: <span className="font-semibold">{m.manOfMatch}</span>
            </p>
          )}

          <Link
            href={`/matches/${m.id}/potm`}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            <Star className="h-4 w-4" />
            Vote for Player of the Match
          </Link>

          <h2 className="mb-6 text-lg font-bold text-center">Scorecard</h2>

          {/* 1st Innings */}
          <div className="mb-8 rounded-xl border-2 border-[var(--accent)] p-4">
            <h2 className="mb-4 text-lg font-bold">{firstBattingTeam.name} Innings</h2>
            {BattingTable({ performances: firstBattingPerf, allPerformances: allPerfs, heading: "Batting" })}
            {FallOfWickets({ battingPerformances: firstBattingPerf, allPerformances: allPerfs, inning: firstInning })}
            {BowlingTable({ performances: firstBowlingPerf, heading: "Bowling" })}
            {PartnershipCard({ battingPerformances: firstBattingPerf, allPerformances: allPerfs, inning: firstInning })}
          </div>

          {/* 2nd Innings */}
          <div className="mb-8 rounded-xl border-2 border-[var(--border)] p-4">
            <h2 className="mb-4 text-lg font-bold">{secondBattingTeam.name} Innings</h2>
            {BattingTable({ performances: secondBattingPerf, allPerformances: allPerfs, heading: "Batting" })}
            {FallOfWickets({ battingPerformances: secondBattingPerf, allPerformances: allPerfs, inning: secondInning })}
            {BowlingTable({ performances: secondBowlingPerf, heading: "Bowling" })}
            {PartnershipCard({ battingPerformances: secondBattingPerf, allPerformances: allPerfs, inning: secondInning })}
          </div>

          {m.youtubeUrl && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">Match Highlights</h3>
              <div className="overflow-hidden rounded-xl aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(m.youtubeUrl)}`}
                  className="h-full w-full"
                  allowFullScreen
                  title="Match Highlights"
                />
              </div>
              <a href={m.youtubeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
                Watch on YouTube &rarr;
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MatchDetailPage