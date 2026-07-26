import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Match, Team, Inning, PlayerMatch, Player, SuperOverInnings } from "@prisma/client"
import { H2H } from "@/components/H2H"
import { ShareButtons } from "@/components/ShareButtons"
import { Star, Trophy, Users } from "lucide-react"
import { MATCH_CONFIG } from "@/lib/config"
import { calculatePartnerships, getHighestPartnership, type BallData, type Partnership } from "@/lib/partnerships"

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
  superOvers: SuperOverInnings[]
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
    case "run out":
    case "runout": return `run out (${fn || bn})`
    case "hit wicket": return `hit wicket b ${bn}`
    case "retired_hurt": return "retired hurt"
    case "retired_out": return "retired out"
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
  if (!inning) return null
  const ballsData: BallData[] = JSON.parse(inning.ballsData || "[]")
  if (ballsData.length === 0) return null

  const partnerships = calculatePartnerships(ballsData)
  if (partnerships.length === 0) return null

  const highest = getHighestPartnership(partnerships)

  function wicketLabel(wn: number) {
    const labels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
    return labels[wn] || `${wn + 1}th`
  }

  function playerName(id: string) {
    if (id.startsWith("batter_")) return `Batter ${id.replace("batter_", "")}`
    return allPerformances.find(p => p.playerId === id)?.player.name || id.slice(0, 8)
  }

  const maxRuns = Math.max(...partnerships.map(p => p.runs), 1)

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="font-semibold">Partnerships</h3>
        {highest && (
          <span className="rounded bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            Best: {highest.runs} ({wicketLabel(highest.wicketNumber)} wkt)
          </span>
        )}
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4">
        {partnerships.map((p, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">
                {wicketLabel(p.wicketNumber)} wkt
                {p.isCurrent && <span className="ml-1 text-green-500">(current)</span>}
              </span>
              <span className="text-[var(--muted-foreground)]">
                <Link href={`/players/${p.batter1Id}`} className="hover:text-[var(--accent)]">{playerName(p.batter1Id)}</Link>
                {" & "}
                <Link href={`/players/${p.batter2Id}`} className="hover:text-[var(--accent)]">{playerName(p.batter2Id)}</Link>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(p.runs / maxRuns) * 100}%` }} />
              </div>
              <span className="w-20 text-right text-xs font-bold">{p.runs} <span className="font-normal text-[var(--muted-foreground)]">({p.balls}b)</span></span>
            </div>
            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
              {playerName(p.batter1Id)}: {p.batsman1Runs} ({p.batsman1Balls}b) · {playerName(p.batter2Id)}: {p.batsman2Runs} ({p.batsman2Balls}b)
            </p>
          </div>
        ))}
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
        <table className="min-w-[400px] w-full text-sm">
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
  const [match, squad] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: {
        team1: true,
        team2: true,
        season: true,
        innings: true,
        performances: { include: { player: true } },
        superOvers: true,
      },
    }),
    prisma.squadMember.findMany({
      where: { matchId: id },
      include: { player: { select: { name: true, role: true, photo: true } } },
    }),
  ])
  if (!match) notFound()

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
              Toss: {m.tossWinner === m.team1Id ? m.team1.name : m.team2.name} won & elected to {m.tossDecision} first
              {m.tossTime && ` at ${m.tossTime}`}
            </p>
          )}

          {(m.umpire1 || m.umpire2 || m.thirdUmpire || m.matchReferee || m.officialScorer || m.matchStartTime || m.matchEndTime || m.delayReason) && (
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="mb-3 text-sm font-semibold">Match Officials</h3>
              <div className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
                {m.umpire1 && <div><span className="text-[var(--muted-foreground)]">Umpire 1:</span> <span className="font-medium">{m.umpire1}</span></div>}
                {m.umpire2 && <div><span className="text-[var(--muted-foreground)]">Umpire 2:</span> <span className="font-medium">{m.umpire2}</span></div>}
                {m.thirdUmpire && <div><span className="text-[var(--muted-foreground)]">Third Umpire:</span> <span className="font-medium">{m.thirdUmpire}</span></div>}
                {m.matchReferee && <div><span className="text-[var(--muted-foreground)]">Referee:</span> <span className="font-medium">{m.matchReferee}</span></div>}
                {m.officialScorer && <div><span className="text-[var(--muted-foreground)]">Scorer:</span> <span className="font-medium">{m.officialScorer}</span></div>}
                {m.matchStartTime && <div><span className="text-[var(--muted-foreground)]">Start:</span> <span className="font-medium">{m.matchStartTime}</span></div>}
                {m.matchEndTime && <div><span className="text-[var(--muted-foreground)]">End:</span> <span className="font-medium">{m.matchEndTime}</span></div>}
                {m.delayReason && <div className="md:col-span-2"><span className="text-[var(--muted-foreground)]">Delay:</span> <span className="font-medium text-amber-600">{m.delayReason}</span></div>}
              </div>
            </div>
          )}

          {squad.length > 0 && (
            <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="mb-3 text-sm font-semibold">Playing XI</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {squad.map(s => (
                  <div key={s.id} className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {s.player.photo && s.player.photo !== "/placeholder-player.svg"
                      ? <img src={s.player.photo} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                      : <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-bold">{s.player.name.charAt(0)}</div>}
                    <span className="truncate">{s.player.name}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{s.player.role}</span>
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

          {(() => {
            if (m.status !== "live" || !team1Inning || !team2Inning) return null
            const battingFirst = team1BatFirst ? team1Inning : team2Inning
            const chasingTeam = team1BatFirst ? m.team2 : m.team1
            const chasingInning = team1BatFirst ? team2Inning : team1Inning
            const target = battingFirst.runs + battingFirst.extras + 1
            const needed = target - (chasingInning.runs + chasingInning.extras)
            const ballsLeft = MATCH_CONFIG.totalBalls - chasingInning.balls
            return (
              <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-center">
                <p className="text-xs font-semibold text-amber-600">TARGET</p>
                <p className="text-2xl font-black text-amber-600">{target}</p>
                <p className="text-[10px] text-amber-600/70">
                  {chasingTeam.name} need {Math.max(0, needed)} runs from {Math.max(0, ballsLeft)} balls
                </p>
              </div>
            )
          })()}

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

          {/* Super Over History */}
          {m.superOvers.length > 0 && (() => {
            const sorted = [...m.superOvers].sort((a, b) => a.superOverNumber - b.superOverNumber)
            const totalSO = sorted.length > 0 ? sorted[sorted.length - 1].superOverNumber : 0
            const soGroups: Record<number, typeof sorted> = {}
            for (const so of sorted) {
              if (!soGroups[so.superOverNumber]) soGroups[so.superOverNumber] = []
              soGroups[so.superOverNumber].push(so)
            }
            return (
              <div className="mb-8 rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-bold">Super Over History</h2>
                </div>
                {Object.entries(soGroups).map(([num, innings]) => (
                  <div key={num} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🏏</span>
                      <h3 className="font-bold text-amber-600 dark:text-amber-400">
                        Super Over #{num} {Number(num) > 1 ? `(${Number(num) === totalSO ? "Final" : "Tied"})` : ""}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {innings.map((inn) => {
                        const team = inn.teamId === m.team1Id ? m.team1 : m.team2
                        return (
                          <div key={inn.id} className={`rounded-lg p-3 ${inn.isWinner ? "border-2 border-green-500/40 bg-green-500/10" : "border border-[var(--border)] bg-[var(--card)]"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {team.logo && <img src={team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />}
                              <span className="font-semibold text-sm">{team.name}</span>
                              {inn.isWinner && <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">WINNER</span>}
                            </div>
                            <p className="text-2xl font-black">{inn.runs}/{inn.wickets}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {inn.balls} {inn.balls === 1 ? "ball" : "balls"}{inn.extras > 0 ? ` · ${inn.extras} extras` : ""}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                    {(() => {
                      const winner = innings.find(i => i.isWinner)
                      const isTied = !winner && innings.length === 2 && innings[0].runs === innings[1].runs && innings[0].wickets === innings[1].wickets
                      return (
                        <p className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">
                          {winner ? `${(winner.teamId === m.team1Id ? m.team1 : m.team2).name} won Super Over #${num}` : isTied ? "Tied" : ""}
                        </p>
                      )
                    })()}
                    {innings.some(i => {
                      const balls = typeof i.ballsData === "string" ? JSON.parse(i.ballsData) : i.ballsData
                      return Array.isArray(balls) && balls.length > 0
                    }) && (
                      <details className="mt-2 group">
                        <summary className="cursor-pointer text-xs font-semibold text-[var(--accent)] hover:underline select-none">
                          View Ball-by-Ball
                        </summary>
                        <div className="mt-2 space-y-2">
                          {innings.map((inn) => {
                            const team = inn.teamId === m.team1Id ? m.team1 : m.team2
                            const balls = typeof inn.ballsData === "string" ? JSON.parse(inn.ballsData) : inn.ballsData
                            if (!Array.isArray(balls) || balls.length === 0) return null
                            const groups: { over: number; balls: typeof balls }[] = []
                            let legalCount = 0
                            let currentGroup: typeof balls = []
                            for (const ball of balls) {
                              const isLegal = !ball.isWide && !ball.isNoBall
                              if (isLegal && legalCount > 0 && legalCount % 6 === 0) {
                                groups.push({ over: groups.length, balls: currentGroup })
                                currentGroup = []
                              }
                              currentGroup.push(ball)
                              if (isLegal) legalCount++
                            }
                            if (currentGroup.length > 0) groups.push({ over: groups.length, balls: currentGroup })
                            return (
                              <div key={inn.id} className="rounded-lg bg-[var(--card)] border border-[var(--border)] p-3">
                                <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">{team.shortName} — {inn.runs}/{inn.wickets}</p>
                                <div className="space-y-1.5">
                                  {groups.map((g) => (
                                    <div key={g.over} className="flex items-center gap-2">
                                      <span className="w-8 shrink-0 text-right text-[10px] font-semibold text-[var(--muted-foreground)]">
                                        {g.over + 1}
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {g.balls.map((ball: any, i: number) => {
                                          let text = "0"
                                          let color = "bg-[var(--muted)]"
                                          if (ball.wicket) { text = "W"; color = "bg-purple-600 text-white" }
                                          else if (ball.isWide) { text = "Wd"; color = "bg-gray-500 text-white" }
                                          else if (ball.isNoBall) { text = "Nb"; color = "bg-gray-500 text-white" }
                                          else if (ball.byes > 0) { text = `${ball.byes}B`; color = "bg-gray-500 text-white" }
                                          else if (ball.legByes > 0) { text = `${ball.legByes}LB`; color = "bg-gray-500 text-white" }
                                          else {
                                            const r = ball.runs
                                            if (r === 1) color = "bg-blue-500 text-white"
                                            else if (r === 2) color = "bg-yellow-500 text-white"
                                            else if (r === 3) color = "bg-orange-500 text-white"
                                            else if (r === 4) color = "bg-pink-500 text-white"
                                            else if (r === 6) color = "bg-red-500 text-white"
                                            text = String(r)
                                          }
                                          return (
                                            <span key={i} title={ball.region || ""} className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded px-1 text-xs font-bold ${color}`}>
                                              {text}
                                            </span>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}

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