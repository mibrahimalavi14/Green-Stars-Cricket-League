import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { relativeDateLabel, getVenueMapsUrl } from "@/lib/utils"
import { recalcPointsTable } from "@/lib/stats"

export const revalidate = 30

async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      teams: { include: { players: true } },
      matches: {
        orderBy: { date: "asc" },
        include: { team1: true, team2: true },
      },
    },
  })

  if (!season) notFound()

  const teamIds = season.teams.map(t => t.id)
  const allPlayers = season.teams.flatMap(t => t.players)

  const standings = await recalcPointsTable(season.id)

  // Fetch performances only for matches in this season
  const seasonMatchIds = season.matches.map(match => match.id)
  const allPerformances = await prisma.playerMatch.findMany({
    where: { matchId: { in: seasonMatchIds } },
  })
  const perfByPlayer = new Map<string, typeof allPerformances>()
  for (const p of allPerformances) {
    if (!perfByPlayer.has(p.playerId)) perfByPlayer.set(p.playerId, [])
    perfByPlayer.get(p.playerId)!.push(p)
  }

  function playoffLabel(d: Date) {
    const iso = d.toISOString()
    if (iso.startsWith("2026-08-16T11:")) return "Qualifier 1"
    if (iso.startsWith("2026-08-16T12:")) return "Eliminator"
    if (iso.startsWith("2026-08-16T13:")) return "Qualifier 2"
    if (iso.startsWith("2026-08-23T")) return "Final"
    return ""
  }

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
      {allPlayers.length > 0 && (() => {
        const ss = new Map<string, { runs: number; balls: number; fours: number; sixes: number; wickets: number; rc: number; bb: number; dismissals: number; inns: number }>()
        for (const p of allPlayers) {
          const perfs = perfByPlayer.get(p.id) || []
          ss.set(p.id, {
            runs: perfs.reduce((s, x) => s + x.battingRuns, 0),
            balls: perfs.reduce((s, x) => s + x.ballsFaced, 0),
            fours: perfs.reduce((s, x) => s + x.fours, 0),
            sixes: perfs.reduce((s, x) => s + x.sixes, 0),
            wickets: perfs.reduce((s, x) => s + x.bowlingWickets, 0),
            rc: perfs.reduce((s, x) => s + x.bowlingRuns, 0),
            bb: perfs.reduce((s, x) => s + x.ballsBowled, 0),
            dismissals: perfs.filter(x => x.isOut).length,
            inns: perfs.filter(x => x.ballsFaced > 0).length,
          })
        }

        const tR = [...ss.entries()].filter(([_, s]) => s.runs > 0).sort((a, b) => b[1].runs - a[1].runs)[0]
        const m4 = [...ss.entries()].filter(([_, s]) => s.fours > 0).sort((a, b) => b[1].fours - a[1].fours)[0]
        const m6 = [...ss.entries()].filter(([_, s]) => s.sixes > 0).sort((a, b) => b[1].sixes - a[1].sixes)[0]
        const bA = [...ss.entries()].filter(([_, s]) => s.inns >= 3 && s.runs > 0).sort((a, b) => (b[1].runs / Math.max(b[1].dismissals, 1)) - (a[1].runs / Math.max(a[1].dismissals, 1)))[0]
        const sR = [...ss.entries()].filter(([_, s]) => s.balls >= 10).sort((a, b) => (b[1].runs / b[1].balls) - (a[1].runs / a[1].balls))[0]
        const tW = [...ss.entries()].filter(([_, s]) => s.wickets > 0).sort((a, b) => b[1].wickets - a[1].wickets || a[1].rc - b[1].rc)[0]
        const bA2 = [...ss.entries()].filter(([_, s]) => s.wickets >= 3).sort((a, b) => (a[1].rc / a[1].wickets) - (b[1].rc / b[1].wickets))[0] || tW
        const eR = [...ss.entries()].filter(([_, s]) => s.bb >= 12).sort((a, b) => (a[1].rc / (a[1].bb / 6)) - (b[1].rc / (b[1].bb / 6)))[0]
        const aR = [...ss.entries()].filter(([_, s]) => s.runs >= 20 && s.wickets >= 2).sort((a, b) => (b[1].runs + b[1].wickets * 20) - (a[1].runs + a[1].wickets * 20))[0]

        const pMap = new Map(allPlayers.map(p => [p.id, p]))
        const getP = (id: string) => pMap.get(id)

        return (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold">Tournament Leaders</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <LeaderCard label="Orange Cap" stat="Runs" value={tR ? String(tR[1].runs) : "-"} name={getP(tR?.[0] ?? "")?.name || "Yet to be decided"} color="orange" />
              <LeaderCard label="Most Fours" stat="Fours" value={m4 ? String(m4[1].fours) : "-"} name={getP(m4?.[0] ?? "")?.name || "Yet to be decided"} color="blue" />
              <LeaderCard label="Most Sixes" stat="Sixes" value={m6 ? String(m6[1].sixes) : "-"} name={getP(m6?.[0] ?? "")?.name || "Yet to be decided"} color="purple" />
              <LeaderCard label="Best Strike Rate" stat="SR" value={sR ? ((sR[1].runs / sR[1].balls) * 100).toFixed(1) : "-"} name={getP(sR?.[0] ?? "")?.name || "Yet to be decided"} color="cyan" sub="min 10 balls" />
              <LeaderCard label="Best Batting Avg" stat="Avg" value={bA ? (bA[1].runs / Math.max(bA[1].dismissals, 1)).toFixed(2) : "-"} name={getP(bA?.[0] ?? "")?.name || "Yet to be decided"} color="emerald" sub="min 3 inns" />
              <LeaderCard label="Purple Cap" stat="Wickets" value={tW ? String(tW[1].wickets) : "-"} name={getP(tW?.[0] ?? "")?.name || "Yet to be decided"} color="violet" />
              <LeaderCard label="Best Bowling Avg" stat="Avg" value={bA2 ? (bA2[1].rc / bA2[1].wickets).toFixed(2) : "-"} name={getP(bA2?.[0] ?? "")?.name || "Yet to be decided"} color="red" sub="min 3 wkts" />
              <LeaderCard label="Best Economy" stat="Econ" value={eR ? (eR[1].rc / (eR[1].bb / 6)).toFixed(2) : "-"} name={getP(eR?.[0] ?? "")?.name || "Yet to be decided"} color="teal" sub="min 2 ov" />
              <LeaderCard label="Best All-Rounder" stat="Pts" value={aR ? String(aR[1].runs + aR[1].wickets * 20) : "-"} name={getP(aR?.[0] ?? "")?.name || "Yet to be decided"} color="amber" sub="min 20r 2w" />
            </div>
          </section>
        )
      })()}

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
                      {t.logo && <img src={t.logo} alt={t.name} className="h-6 w-6 rounded-full object-cover" />}
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

      <section>
        <h2 className="mb-4 text-xl font-semibold">Matches</h2>
        {season.matches.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No matches scheduled.</p>
        ) : (
          <>
            {season.matches.some(match => match.date < new Date("2026-08-16T00:00:00.000Z")) && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">League Stage</h3>
                <div className="space-y-3">
                  {season.matches.filter(match => match.date < new Date("2026-08-16T00:00:00.000Z")).map((match) => (
                    <div key={match.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
                      {match.matchNo > 0 && <div className="-mt-1 mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {match.matchNo}</div>}
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        {/* Team 1 */}
                        <div className="order-1 flex min-w-0 flex-1 items-center gap-2">
                          <div className="flex items-center gap-2">
                            {match.team1.logo && <img src={match.team1.logo} alt={match.team1.name} className="h-7 w-7 shrink-0 rounded-full object-cover sm:h-8 sm:w-8" />}
                            <span className="truncate text-sm font-medium sm:text-base">{match.team1.name}</span>
                          </div>
                          {match.status === "completed" && match.team1Score && (
                            <span className="text-xs font-semibold sm:text-sm">{match.team1Score}</span>
                          )}
                        </div>
                        {/* VS - visible on mobile, hidden on desktop (shown in center below) */}
                        <div className="order-2 text-center sm:hidden">
                          <div className="text-xs font-bold text-[var(--accent)]">VS</div>
                        </div>
                        {/* Date - visible on mobile (between VS and Team 2), hidden on desktop */}
                        <div className="order-3 text-center sm:hidden">
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {(() => { const r = relativeDateLabel(new Date(match.date)); return r.label ? <span className={r.className}>{r.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                            {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                          </div>
                        </div>
                        {/* Team 2 */}
                        <div className="order-4 flex min-w-0 flex-1 items-center justify-end gap-2 sm:order-5">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium sm:text-base">{match.team2.name}</span>
                            {match.team2.logo && <img src={match.team2.logo} alt={match.team2.name} className="h-7 w-7 shrink-0 rounded-full object-cover sm:h-8 sm:w-8" />}
                          </div>
                          {match.status === "completed" && match.team2Score && (
                            <span className="text-xs font-semibold sm:text-sm">{match.team2Score}</span>
                          )}
                        </div>
                        {/* Center (date, VS, venue) - hidden on mobile, visible on desktop */}
                        <div className="order-5 shrink-0 text-center sm:order-3">
                          <div className="hidden text-xs text-[var(--muted-foreground)] sm:block">
                            {(() => { const r = relativeDateLabel(new Date(match.date)); return r.label ? <span className={r.className}>{r.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                            {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                          </div>
                          <div className="my-1 hidden text-xs font-bold text-[var(--accent)] sm:block">VS</div>
                          <div className="hidden text-xs text-[var(--muted-foreground)] sm:block">{(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</div>
                          {/* Venue - visible on mobile (below team 2), hidden on desktop */}
                          <div className="mt-0.5 sm:hidden">
                            <div className="text-xs text-[var(--muted-foreground)]">{(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</div>
                          </div>
                          {match.status === "completed" && match.result && (
                            <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">{match.result}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {season.matches.some(match => match.date >= new Date("2026-08-16T00:00:00.000Z")) && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Playoffs</h3>
                <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                  Top 4 teams from the Points Table will qualify for the Playoffs.
                </p>
                <div className="space-y-3">
                  {season.matches.filter(match => match.date >= new Date("2026-08-16T00:00:00.000Z")).map((match) => (
                    <div key={match.id} className="rounded-xl border border-amber-200 bg-[var(--card)] p-3 sm:p-4 dark:border-amber-800/40">
                      {match.matchNo > 0 && <div className="mb-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Match {match.matchNo}</div>}
                      <div className="mb-1">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{playoffLabel(new Date(match.date))}</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                          <span className="font-bold text-amber-600 dark:text-amber-400">TBD</span>
                        </div>
                        <div className="shrink-0 text-center">
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {(() => { const r = relativeDateLabel(new Date(match.date)); return r.label ? <span className={r.className}>{r.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                            {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                          </div>
                          <div className="my-1 text-xs font-bold text-amber-600 dark:text-amber-400">VS</div>
                          <div className="text-xs text-[var(--muted-foreground)]">TBD</div>
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                          <span className="font-bold text-amber-600 dark:text-amber-400">TBD</span>
                        </div>
                      </div>
                    </div>
                  ))}
                    </div>
              </div>
            )}
          </>
        )}
      </section>

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
                    <th className="p-3 text-center" title="Innings">Inn</th>
                    <th className="p-3 text-center">Runs</th>
                    <th className="p-3 text-center">Balls</th>
                    <th className="p-3 text-center" title="Highest Score">HS</th>
                    <th className="p-3 text-center" title="Average">Avg</th>
                    <th className="p-3 text-center" title="Strike Rate">SR</th>
                    <th className="p-3 text-center" title="Fours">4s</th>
                    <th className="p-3 text-center" title="Sixes">6s</th>
                    <th className="p-3 text-center" title="Not Outs">NO</th>
                    <th className="p-3 text-center" title="Ducks (0 runs)">Duck</th>
                    <th className="p-3 text-center">50</th>
                    <th className="p-3 text-center">100</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.filter(p => (perfByPlayer.get(p.id)?.filter(x => x.ballsFaced > 0)?.length ?? 0) > 0)
                    .map(p => {
                      const perfs = perfByPlayer.get(p.id) || []
                      return {
                        p,
                        runs: perfs.reduce((s, x) => s + x.battingRuns, 0),
                        balls: perfs.reduce((s, x) => s + x.ballsFaced, 0),
                        fours: perfs.reduce((s, x) => s + x.fours, 0),
                        sixes: perfs.reduce((s, x) => s + x.sixes, 0),
                        inns: perfs.filter(x => x.ballsFaced > 0).length,
                        dismissals: perfs.filter(x => x.isOut).length,
                        hs: Math.max(...perfs.map(x => x.battingRuns), 0),
                        notOuts: perfs.filter(x => x.ballsFaced > 0 && !x.isOut).length,
                        ducks: perfs.filter(x => x.battingRuns === 0 && x.isOut).length,
                        fifties: perfs.filter(x => x.battingRuns >= 50 && x.battingRuns < 100).length,
                        hundreds: perfs.filter(x => x.battingRuns >= 100).length,
                        matches: new Set(perfs.map(x => x.matchId)).size,
                      }
                    })
                    .sort((a, b) => b.runs - a.runs)
                    .map((s, i) => {
                      const avg = s.runs > 0 && s.dismissals > 0 ? (s.runs / s.dismissals).toFixed(2) : "-"
                      const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "-"
                      return (
                        <tr key={s.p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                          <td className="p-3 text-center font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                          <td className="p-3 font-medium">{s.p.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {season.teams.find(t => t.id === s.p.teamId)?.logo && (
                                <img src={season.teams.find(t => t.id === s.p.teamId)!.logo} alt="" className="h-5 w-5 rounded-full object-cover" />
                              )}
                              <span className="text-[var(--muted-foreground)]">{season.teams.find(t => t.id === s.p.teamId)?.name}</span>
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
                          <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">{s.fifties}</td>
                          <td className="p-3 text-center text-green-600 dark:text-green-400">{s.hundreds}</td>
                        </tr>
                      )
                    })}
                  {allPlayers.filter(p => (perfByPlayer.get(p.id)?.length ?? 0) > 0).length === 0 && (
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
                    <th className="p-3 text-center" title="Innings">Inn</th>
                    <th className="p-3 text-center">Overs</th>
                    <th className="p-3 text-center" title="Wickets">Wkts</th>
                    <th className="p-3 text-center">Runs</th>
                    <th className="p-3 text-center" title="Best Bowling">BB</th>
                    <th className="p-3 text-center" title="Strike Rate">SR</th>
                    <th className="p-3 text-center" title="Average">Avg</th>
                    <th className="p-3 text-center" title="Economy Rate">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.filter(p => (perfByPlayer.get(p.id)?.filter(x => x.ballsBowled > 0)?.length ?? 0) > 0)
                    .map(p => {
                      const perfs = perfByPlayer.get(p.id) || []
                      return {
                        p,
                        wickets: perfs.reduce((s, x) => s + x.bowlingWickets, 0),
                        runsConceded: perfs.reduce((s, x) => s + x.bowlingRuns, 0),
                        ballsBowled: perfs.reduce((s, x) => s + x.ballsBowled, 0),
                        inns: perfs.filter(x => x.ballsBowled > 0).length,
                        bestWkts: Math.max(...perfs.map(x => x.bowlingWickets), 0),
                        bestRuns: (() => {
                          const bw = Math.max(...perfs.map(x => x.bowlingWickets), 0)
                          return perfs.filter(x => x.bowlingWickets === bw).reduce((min, x) => Math.min(min, x.bowlingRuns), Infinity)
                        })(),
                        matches: new Set(perfs.map(x => x.matchId)).size,
                      }
                    })
                    .filter(s => s.wickets > 0)
                    .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
                    .map((s, i) => {
                      const overs = Math.floor(s.ballsBowled / 6) + "." + (s.ballsBowled % 6)
                      const bb = s.bestWkts > 0 ? `${s.bestWkts}/${s.bestRuns}` : "-"
                      const sr = s.wickets > 0 ? (s.ballsBowled / s.wickets).toFixed(1) : "-"
                      const avg = s.wickets > 0 ? (s.runsConceded / s.wickets).toFixed(2) : "-"
                      const econ = s.ballsBowled > 0 ? (s.runsConceded / (s.ballsBowled / 6)).toFixed(2) : "-"
                      return (
                        <tr key={s.p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                          <td className="p-3 text-center font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                          <td className="p-3 font-medium">{s.p.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {season.teams.find(t => t.id === s.p.teamId)?.logo && (
                                <img src={season.teams.find(t => t.id === s.p.teamId)!.logo} alt="" className="h-5 w-5 rounded-full object-cover" />
                              )}
                              <span className="text-[var(--muted-foreground)]">{season.teams.find(t => t.id === s.p.teamId)?.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">{s.matches}</td>
                          <td className="p-3 text-center">{s.inns}</td>
                          <td className="p-3 text-center font-mono">{overs}</td>
                          <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{s.wickets}</td>
                          <td className="p-3 text-center">{s.runsConceded}</td>
                          <td className="p-3 text-center font-medium">{bb}</td>
                          <td className="p-3 text-center font-mono">{sr}</td>
                          <td className="p-3 text-center font-mono">{avg}</td>
                          <td className="p-3 text-center font-mono">{econ}</td>
                        </tr>
                      )
                    })}
                  {allPlayers.filter(p => p.wickets > 0).length === 0 && (
                    <tr><td colSpan={12} className="p-4 text-center text-[var(--muted-foreground)]">No bowling data yet.</td></tr>
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
    blue: "bg-blue-100 text-blue-600 dark:text-blue-400 dark:bg-blue-900/30",
    purple: "bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-900/30",
    cyan: "bg-cyan-100 text-cyan-600 dark:text-cyan-400 dark:bg-cyan-900/30",
    emerald: "bg-emerald-100 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-900/30",
    violet: "bg-violet-100 text-violet-700 dark:text-violet-400 dark:bg-violet-900/60",
    red: "bg-red-100 text-red-600 dark:text-red-400 dark:bg-red-900/30",
    teal: "bg-teal-100 text-teal-600 dark:text-teal-400 dark:bg-teal-900/30",
    amber: "bg-amber-100 text-amber-600 dark:text-amber-400 dark:bg-amber-900/30",
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-center">
      <div className={`mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${colorMap[color] || colorMap.orange}`}>
        {name.charAt(0)}
      </div>
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${color === 'orange' ? 'text-orange-600 dark:text-orange-400' : color === 'blue' ? 'text-blue-600 dark:text-blue-400' : color === 'purple' ? 'text-purple-600 dark:text-purple-400' : color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' : color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : color === 'violet' ? 'text-violet-700 dark:text-violet-400' : color === 'red' ? 'text-red-600 dark:text-red-400' : color === 'teal' ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-bold">{name}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-[var(--muted-foreground)]">{sub || stat}</div>
    </div>
  )
}
