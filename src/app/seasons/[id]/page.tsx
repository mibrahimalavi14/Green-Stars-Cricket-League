import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { relativeDateLabel, getVenueMapsUrl } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      teams: true,
      matches: {
        orderBy: { date: "asc" },
        include: { team1: true, team2: true, innings: true },
      },
    },
  })

  if (!season) notFound()

  const teamIds = season.teams.map(t => t.id)
  const matchIds = season.matches.map(m => m.id)

  // Compute standings from matches+innings data directly (no recalcPointsTable call)
  const standings = season.teams.map(team => {
    const s = { played: 0, won: 0, lost: 0, tied: 0, nr: 0, forRuns: 0, forBalls: 0, againstRuns: 0, againstBalls: 0 }
    const teamMatches = season.matches.filter(m => (m.team1Id === team.id || m.team2Id === team.id) && m.status === "completed")
    for (const m of teamMatches) {
      s.played++
      const result = m.result.toLowerCase()
      if (result.includes("tied")) { s.tied++ }
      else if (result === "no result" || result.includes("abandon")) { s.nr++ }
      else {
        const t1Match = result.includes(m.team1.name.toLowerCase()) || result.includes(m.team1.shortName.toLowerCase())
        const t2Match = result.includes(m.team2.name.toLowerCase()) || result.includes(m.team2.shortName.toLowerCase())
        if (t1Match && !t2Match) { if (m.team1Id === team.id) s.won++; else s.lost++ }
        else if (t2Match && !t1Match) { if (m.team2Id === team.id) s.won++; else s.lost++ }
      }
      const inn1 = m.innings.find(i => i.teamId === m.team1Id)
      const inn2 = m.innings.find(i => i.teamId === m.team2Id)
      if (m.team1Id === team.id) {
        if (inn1) { s.forRuns += inn1.runs + inn1.extras; s.forBalls += inn1.balls }
        if (inn2) { s.againstRuns += inn2.runs + inn2.extras; s.againstBalls += inn2.balls }
      } else {
        if (inn2) { s.forRuns += inn2.runs + inn2.extras; s.forBalls += inn2.balls }
        if (inn1) { s.againstRuns += inn1.runs + inn1.extras; s.againstBalls += inn1.balls }
      }
    }
    const forOvers = s.forBalls / 6
    const againstOvers = s.againstBalls / 6
    const nrr = forOvers > 0 && againstOvers > 0
      ? ((s.forRuns / forOvers) - (s.againstRuns / againstOvers))
      : forOvers > 0 ? s.forRuns / forOvers : 0
    return {
      id: team.id, name: team.name, shortName: team.shortName, logo: team.logo, color: team.color,
      played: s.played, won: s.won, lost: s.lost, tied: s.tied, nr: s.nr,
      points: s.won * 2 + s.tied * 1 + s.nr * 1, nrr,
    }
  }).sort((a, b) => b.points - a.points || b.nrr - a.nrr)

  // Fetch player performances with minimal fields
  const perfs = matchIds.length > 0 ? await prisma.playerMatch.findMany({
    where: { matchId: { in: matchIds } },
    select: {
      playerId: true, matchId: true, teamId: true,
      battingRuns: true, ballsFaced: true, isOut: true,
      bowlingWickets: true, bowlingRuns: true, ballsBowled: true, maidens: true,
      catches: true, stumpings: true, runOuts: true,
      fours: true, sixes: true, ones: true, twos: true,
      threes: true, dotBalls: true, wides: true, noBalls: true,
    },
  }) : []
  const perfByPlayer = new Map<string, typeof perfs>()
  for (const p of perfs) {
    if (!perfByPlayer.has(p.playerId)) perfByPlayer.set(p.playerId, [])
    perfByPlayer.get(p.playerId)!.push(p)
  }

  // Fetch minimal player data
  const allPlayers = await prisma.player.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true, name: true, teamId: true, role: true, runs: true, wickets: true },
  })
  const pMap = new Map(allPlayers.map(p => [p.id, p]))

  function stageLabel(stage: string): string {
    return stage === "qualifier1" ? "Qualifier 1" :
           stage === "qualifier2" ? "Qualifier 2" :
           stage === "eliminator" ? "Eliminator" :
           stage === "final" ? "Final" : stage
  }

  // Tournament leaders
  const ss = new Map<string, { runs: number; balls: number; fours: number; sixes: number; wickets: number; rc: number; bb: number; dismissals: number; inns: number; innings: number }>()
  for (const p of allPlayers) {
    const pfs = perfByPlayer.get(p.id) || []
    ss.set(p.id, {
      runs: pfs.reduce((s, x) => s + x.battingRuns, 0),
      balls: pfs.reduce((s, x) => s + x.ballsFaced, 0),
      fours: pfs.reduce((s, x) => s + x.fours, 0),
      sixes: pfs.reduce((s, x) => s + x.sixes, 0),
      wickets: pfs.reduce((s, x) => s + x.bowlingWickets, 0),
      rc: pfs.reduce((s, x) => s + x.bowlingRuns, 0),
      bb: pfs.reduce((s, x) => s + x.ballsBowled, 0),
      dismissals: pfs.filter(x => x.isOut).length,
      inns: pfs.filter(x => x.ballsFaced > 0).length,
      innings: new Set(pfs.map(x => x.matchId)).size,
    })
  }
  const tR = [...ss].filter(([_, s]) => s.runs > 0).sort((a, b) => b[1].runs - a[1].runs)[0]
  const m6 = [...ss].filter(([_, s]) => s.sixes > 0).sort((a, b) => b[1].sixes - a[1].sixes)[0]
  const sR = [...ss].filter(([_, s]) => s.balls >= 10).sort((a, b) => (b[1].runs / b[1].balls) - (a[1].runs / a[1].balls))[0]
  const tW = [...ss].filter(([_, s]) => s.wickets > 0).sort((a, b) => b[1].wickets - a[1].wickets || a[1].rc - b[1].rc)[0]
  const aR = [...ss].filter(([_, s]) => s.runs >= 20 && s.wickets >= 2).sort((a, b) => (b[1].runs + b[1].wickets * 20) - (a[1].runs + a[1].wickets * 20))[0]
  const tName = (id?: string) => id ? pMap.get(id)?.name || "" : ""

  // Batting stats
  const battingStats = allPlayers
    .filter(p => (perfByPlayer.get(p.id)?.filter(x => x.ballsFaced > 0)?.length ?? 0) > 0)
    .map(p => {
      const pfs = perfByPlayer.get(p.id) || []
      const runs = pfs.reduce((s, x) => s + x.battingRuns, 0)
      return { p, runs, balls: pfs.reduce((s, x) => s + x.ballsFaced, 0), fours: pfs.reduce((s, x) => s + x.fours, 0), sixes: pfs.reduce((s, x) => s + x.sixes, 0), inns: pfs.filter(x => x.ballsFaced > 0).length, dismissals: pfs.filter(x => x.isOut).length, hs: Math.max(...pfs.map(x => x.battingRuns), 0), notOuts: pfs.filter(x => x.ballsFaced > 0 && !x.isOut).length, ducks: pfs.filter(x => x.battingRuns === 0 && x.isOut).length, matches: new Set(pfs.map(x => x.matchId)).size, fifties: pfs.filter(x => x.battingRuns >= 50 && x.battingRuns < 100).length, hundreds: pfs.filter(x => x.battingRuns >= 100).length }
    })
    .sort((a, b) => b.runs - a.runs)

  // Bowling stats
  const bowlingStats = allPlayers
    .filter(p => (perfByPlayer.get(p.id)?.filter(x => x.ballsBowled > 0)?.length ?? 0) > 0)
    .map(p => {
      const pfs = perfByPlayer.get(p.id) || []
      const wickets = pfs.reduce((s, x) => s + x.bowlingWickets, 0)
      const runsConceded = pfs.reduce((s, x) => s + x.bowlingRuns, 0)
      return { p, wickets, runsConceded, ballsBowled: pfs.reduce((s, x) => s + x.ballsBowled, 0), maidens: pfs.reduce((s, x) => s + x.maidens, 0), inns: pfs.filter(x => x.ballsBowled > 0).length, matches: new Set(pfs.map(x => x.matchId)).size, bestWkts: Math.max(...pfs.map(x => x.bowlingWickets), 0), bestRuns: Math.min(...pfs.filter(x => x.bowlingWickets === Math.max(...pfs.map(x => x.bowlingWickets), 0)).map(x => x.bowlingRuns), Infinity) }
    })
    .filter(s => s.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/seasons" className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">&larr; All Seasons</Link>
      <h1 className="mb-1 text-3xl font-bold">{season.name}</h1>
      <p className="text-[var(--muted-foreground)]">{season.year} &middot; {season.teams.length} Teams &middot; {season.matches.length} Matches</p>
      <div className="mb-8 mt-2 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${season.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${season.isActive ? "bg-green-500" : "bg-yellow-500"}`} />
          {season.isActive ? "Active" : "Inactive"}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${season.scheduleAnnounced ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${season.scheduleAnnounced ? "bg-green-500" : "bg-gray-400"}`} />
          Schedule {season.scheduleAnnounced ? "Announced" : "Not Announced"}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${season.scheduleAnnounced ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${season.scheduleAnnounced ? "bg-red-500" : "bg-green-500"}`} />
          Predictions {season.scheduleAnnounced ? "Locked" : "Open"}
        </span>
      </div>

      {/* Tournament Leaders */}
      {allPlayers.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Tournament Leaders</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <LeaderCard label="Orange Cap" stat="Runs" value={tR ? String(tR[1].runs) : "-"} name={tName(tR?.[0]) || "Yet to be decided"} color="orange" />
            <LeaderCard label="Most Sixes" stat="Sixes" value={m6 ? String(m6[1].sixes) : "-"} name={tName(m6?.[0]) || "Yet to be decided"} color="purple" />
            <LeaderCard label="Best Strike Rate" stat="SR" value={sR ? ((sR[1].runs / sR[1].balls) * 100).toFixed(1) : "-"} name={tName(sR?.[0]) || "Yet to be decided"} color="cyan" sub="min 10 balls" />
            <LeaderCard label="Purple Cap" stat="Wickets" value={tW ? String(tW[1].wickets) : "-"} name={tName(tW?.[0]) || "Yet to be decided"} color="violet" />
            <LeaderCard label="Best All-Rounder" stat="Pts" value={aR ? String(aR[1].runs + aR[1].wickets * 20) : "-"} name={tName(aR?.[0]) || "Yet to be decided"} color="amber" sub="min 20r 2w" />
          </div>
        </section>
      )}

      {/* Points Table */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Points Table</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3 text-center">P</th>
                <th className="p-3 text-center">W</th>
                <th className="p-3 text-center">L</th>
                <th className="p-3 text-center">T</th>
                <th className="p-3 text-center">NR</th>
                <th className="p-3 text-center font-bold">Pts</th>
                <th className="p-3 text-center">NRR</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t.id} className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)] ${i < 4 ? "bg-emerald-100 dark:bg-emerald-900/30" : i >= 4 ? "bg-red-100 dark:bg-red-900/30" : ""}`}>
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {t.logo && <img src={t.logo} loading="lazy" alt={t.name} className="h-6 w-6 rounded-full object-cover" />}
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">{t.played}</td>
                  <td className="p-3 text-center text-green-600 dark:text-green-400">{t.won}</td>
                  <td className="p-3 text-center text-red-500">{t.lost}</td>
                  <td className="p-3 text-center">{t.tied}</td>
                  <td className="p-3 text-center">{t.nr}</td>
                  <td className="p-3 text-center font-bold">{t.points}</td>
                  <td className={`p-3 text-center font-mono ${t.nrr > 0 ? "text-green-600 dark:text-green-400" : t.nrr < 0 ? "text-red-500" : ""}`}>{t.nrr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">TOP 4 TEAMS QUALIFY FOR PLAYOFFS</p>
      </section>

      {/* Matches */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Matches</h2>
        {season.matches.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No matches scheduled.</p>
        ) : (
          <>
            {season.matches.some(match => match.stage === "league") && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">League Stage</h3>
                <div className="space-y-3">
                  {season.matches.filter(match => match.stage === "league").map((match) => (
                    <div key={match.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
                      {match.matchNo > 0 && <div className="-mt-1 mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {match.matchNo}</div>}
                      <div className="mb-1 text-center text-xs text-[var(--muted-foreground)]">
                        {(() => { const r = relativeDateLabel(new Date(match.date)); return r.label ? <span className={r.className}>{r.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                        {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                      </div>
                      <div className="mb-2 text-center text-xs text-[var(--muted-foreground)]">
                        {(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 flex-col items-start gap-0.5">
                          <div className="flex items-center gap-2">
                            {match.team1.logo && <img src={match.team1.logo} loading="lazy" alt={match.team1.name} className="h-6 w-6 shrink-0 rounded-full object-cover" />}
                            <span className="text-sm font-medium">{match.team1.name}</span>
                          </div>
                          {match.status === "completed" && match.team1Score && (
                            <span className="ml-8 text-base font-bold">{match.team1Score}</span>
                          )}
                        </div>
                        <div className="shrink-0 text-center">
                          <div className="text-xs font-bold text-[var(--accent)]">VS</div>
                        </div>
                        <div className="flex flex-1 flex-col items-end gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{match.team2.name}</span>
                            {match.team2.logo && <img src={match.team2.logo} loading="lazy" alt={match.team2.name} className="h-6 w-6 shrink-0 rounded-full object-cover" />}
                          </div>
                          {match.status === "completed" && match.team2Score && (
                            <span className="mr-8 text-base font-bold">{match.team2Score}</span>
                          )}
                        </div>
                      </div>
                      {match.status === "completed" && match.result && (
                        <div className="mt-2 text-center text-xs font-medium text-green-600 dark:text-green-400">{match.result}</div>
                      )}
                      <div className="mt-3 text-center">
                        <Link href={`/matches/${match.id}`} className="inline-block rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                          Scorecard &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {season.matches.some(match => match.stage !== "league") && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Playoffs</h3>
                <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                  Top 4 teams from the Points Table will qualify for the Playoffs.
                </p>
                <div className="space-y-3">
                  {season.matches.filter(match => match.stage !== "league").map((match) => (
                    <div key={match.id} className="rounded-xl border border-amber-200 bg-[var(--card)] p-3 sm:p-4 dark:border-amber-800/40">
                      {match.matchNo > 0 && <div className="-mt-1 mb-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Match {match.matchNo}</div>}
                      <div className="mb-1">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{stageLabel(match.stage)}</span>
                      </div>
                      <div className="mb-1 text-center text-xs text-[var(--muted-foreground)]">
                        {(() => { const r = relativeDateLabel(new Date(match.date)); return r.label ? <span className={r.className}>{r.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                        {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 flex-col items-start gap-0.5">
                          <div className="flex items-center gap-2">
                            {match.team1.logo && match.status === "completed" && <img src={match.team1.logo} loading="lazy" alt={match.team1.name} className="h-6 w-6 shrink-0 rounded-full object-cover" />}
                            <span className="text-sm font-medium">{match.status === "upcoming" ? "TBD" : match.team1.name}</span>
                          </div>
                          {match.status === "completed" && match.team1Score && (
                            <span className="ml-8 text-base font-bold">{match.team1Score}</span>
                          )}
                        </div>
                        <div className="shrink-0 text-center">
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">VS</div>
                        </div>
                        <div className="flex flex-1 flex-col items-end gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{match.status === "upcoming" ? "TBD" : match.team2.name}</span>
                            {match.team2.logo && match.status === "completed" && <img src={match.team2.logo} loading="lazy" alt={match.team2.name} className="h-6 w-6 shrink-0 rounded-full object-cover" />}
                          </div>
                          {match.status === "completed" && match.team2Score && (
                            <span className="mr-8 text-base font-bold">{match.team2Score}</span>
                          )}
                        </div>
                      </div>
                      {match.status === "completed" && match.result && (
                        <div className="mt-2 text-center text-xs font-medium text-green-600 dark:text-green-400">{match.result}</div>
                      )}
                      <div className="mt-3 text-center">
                        <Link href={`/matches/${match.id}`} className="inline-block rounded-md bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                          Scorecard &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Player Stats */}
      {allPlayers.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Player Stats</h2>

          <div className="mb-8">
            <h3 className="mb-3 text-lg font-medium">Batting</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                    <th className="p-3 text-center">#</th>
                    <th className="p-3 text-left">Player</th>
                    <th className="p-3 text-left">Team</th>
                    <th className="p-3 text-center">M</th>
                    <th className="p-3 text-center">Inn</th>
                    <th className="p-3 text-center">Runs</th>
                    <th className="p-3 text-center">Balls</th>
                    <th className="p-3 text-center">HS</th>
                    <th className="p-3 text-center">Avg</th>
                    <th className="p-3 text-center">SR</th>
                    <th className="p-3 text-center">4s</th>
                    <th className="p-3 text-center">6s</th>
                    <th className="p-3 text-center">NO</th>
                    <th className="p-3 text-center">Duck</th>
                    <th className="p-3 text-center">50</th>
                    <th className="p-3 text-center">100</th>
                  </tr>
                </thead>
                <tbody>
                  {battingStats.map((s, i) => {
                    const avg = s.runs > 0 && s.dismissals > 0 ? (s.runs / s.dismissals).toFixed(2) : "-"
                    const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "-"
                    const f = season.teams.find(t => t.id === s.p.teamId)
                    return (
                      <tr key={s.p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                        <td className="p-3 text-center font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                        <td className="p-3 font-medium">{s.p.name}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {f?.logo && <img src={f.logo} loading="lazy" alt="" className="h-5 w-5 rounded-full object-cover" />}
                            <span className="text-[var(--muted-foreground)]">{f?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{s.matches}</td>
                        <td className="p-3 text-center">{s.inns}</td>
                        <td className="p-3 text-center font-bold">{s.runs}</td>
                        <td className="p-3 text-center">{s.balls}</td>
                        <td className="p-3 text-center font-medium">{s.hs}</td>
                        <td className="p-3 text-center font-mono">{avg}</td>
                        <td className="p-3 text-center font-mono">{sr}</td>
                        <td className="p-3 text-center text-blue-600 dark:text-blue-400">{s.fours}</td>
                        <td className="p-3 text-center text-purple-600 dark:text-purple-400">{s.sixes}</td>
                        <td className="p-3 text-center">{s.notOuts}</td>
                        <td className="p-3 text-center">{s.ducks}</td>
                        <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">{s.fifties || 0}</td>
                        <td className="p-3 text-center text-green-600 dark:text-green-400">{s.hundreds || 0}</td>
                      </tr>
                    )
                  })}
                  {battingStats.length === 0 && (
                    <tr><td colSpan={16} className="p-4 text-center text-[var(--muted-foreground)]">No batting data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium">Bowling</h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                    <th className="p-3 text-center">#</th>
                    <th className="p-3 text-left">Player</th>
                    <th className="p-3 text-left">Team</th>
                    <th className="p-3 text-center">M</th>
                    <th className="p-3 text-center">Inn</th>
                    <th className="p-3 text-center">Overs</th>
                    <th className="p-3 text-center">Mdns</th>
                    <th className="p-3 text-center">Wkts</th>
                    <th className="p-3 text-center">Runs</th>
                    <th className="p-3 text-center">BBI</th>
                    <th className="p-3 text-center">SR</th>
                    <th className="p-3 text-center">Avg</th>
                    <th className="p-3 text-center">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlingStats.map((s, i) => {
                    const overs = Math.floor(s.ballsBowled / 6) + "." + (s.ballsBowled % 6)
                    const bbi = s.bestWkts > 0 && isFinite(s.bestRuns) ? `${s.bestWkts}/${s.bestRuns}` : "-"
                    const sr = s.wickets > 0 ? (s.ballsBowled / s.wickets).toFixed(1) : "-"
                    const avg = s.wickets > 0 ? (s.runsConceded / s.wickets).toFixed(2) : "-"
                    const econ = s.ballsBowled > 0 ? (s.runsConceded / (s.ballsBowled / 6)).toFixed(2) : "-"
                    const f = season.teams.find(t => t.id === s.p.teamId)
                    return (
                      <tr key={s.p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                        <td className="p-3 text-center font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                        <td className="p-3 font-medium">{s.p.name}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {f?.logo && <img src={f.logo} loading="lazy" alt="" className="h-5 w-5 rounded-full object-cover" />}
                            <span className="text-[var(--muted-foreground)]">{f?.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{s.matches}</td>
                        <td className="p-3 text-center">{s.inns}</td>
                        <td className="p-3 text-center font-mono">{overs}</td>
                        <td className="p-3 text-center">{s.maidens}</td>
                        <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{s.wickets}</td>
                        <td className="p-3 text-center">{s.runsConceded}</td>
                        <td className="p-3 text-center font-medium">{bbi}</td>
                        <td className="p-3 text-center font-mono">{sr}</td>
                        <td className="p-3 text-center font-mono">{avg}</td>
                        <td className="p-3 text-center font-mono">{econ}</td>
                      </tr>
                    )
                  })}
                  {bowlingStats.length === 0 && (
                    <tr><td colSpan={13} className="p-4 text-center text-[var(--muted-foreground)]">No bowling data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default SeasonDetailPage

function LeaderCard({ label, stat, value, name, color, sub }: { label: string; stat: string; value: string; name: string; color: string; sub?: string }) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 dark:text-orange-400 dark:bg-orange-900/30",
    purple: "bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-900/30",
    cyan: "bg-cyan-100 text-cyan-600 dark:text-cyan-400 dark:bg-cyan-900/30",
    violet: "bg-violet-100 text-violet-700 dark:text-violet-400 dark:bg-violet-900/60",
    amber: "bg-amber-100 text-amber-600 dark:text-amber-400 dark:bg-amber-900/30",
  }
  const labelColor = color === 'violet' ? 'text-violet-700 dark:text-violet-400' : `text-${color}-600 dark:text-${color}-400`
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
      <div className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${colorMap[color] || colorMap.orange}`}>
        {name.charAt(0)}
      </div>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>{label}</div>
      <div className="mt-1 truncate text-sm font-bold">{name}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-[var(--muted-foreground)]">{sub || stat}</div>
    </div>
  )
}
