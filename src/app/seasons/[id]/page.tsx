import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

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

  const { recalcPointsTable } = await import("@/lib/stats")
  const standings = await recalcPointsTable(season.id)

  // Fetch performances for all players in this season
  const allPerformances = await prisma.playerMatch.findMany({
    where: { teamId: { in: teamIds } },
  })
  const perfByPlayer = new Map<string, typeof allPerformances>()
  for (const p of allPerformances) {
    if (!perfByPlayer.has(p.playerId)) perfByPlayer.set(p.playerId, [])
    perfByPlayer.get(p.playerId)!.push(p)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/seasons" className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">&larr; All Seasons</Link>
      <h1 className="mb-1 text-3xl font-bold">{season.name}</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">{season.year} &middot; {season.teams.length} Teams &middot; {season.matches.length} Matches</p>

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
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                  <td className="p-3 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <span className="font-medium" style={{ color: t.color }}>{t.name}</span>
                  </td>
                  <td className="p-3 text-center">{t.played}</td>
                  <td className="p-3 text-center text-green-600">{t.won}</td>
                  <td className="p-3 text-center text-red-500">{t.lost}</td>
                  <td className="p-3 text-center">{t.tied}</td>
                  <td className="p-3 text-center">{t.nr}</td>
                  <td className="p-3 text-center font-bold">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Matches</h2>
        {season.matches.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No matches scheduled.</p>
        ) : (
          <div className="space-y-3">
            {season.matches.map((match) => (
              <div key={match.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full" style={{ backgroundColor: match.team1.color }} />
                      <span className="font-medium">{match.team1.shortName}</span>
                    </div>
                    {match.status === "completed" && match.team1Score && (
                      <span className="ml-11 text-sm font-semibold">{match.team1Score}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                    <div className="my-1 text-xs font-bold text-[var(--accent)]">VS</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{match.venue}</div>
                    {match.status === "completed" && match.result && (
                      <div className="mt-1 text-xs font-medium text-green-600">{match.result}</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{match.team2.shortName}</span>
                      <div className="h-8 w-8 rounded-full" style={{ backgroundColor: match.team2.color }} />
                    </div>
                    {match.status === "completed" && match.team2Score && (
                      <span className="mr-11 text-sm font-semibold">{match.team2Score}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                    <th className="p-3 text-center">Inn</th>
                    <th className="p-3 text-center">Runs</th>
                    <th className="p-3 text-center">Balls</th>
                    <th className="p-3 text-center">HS</th>
                    <th className="p-3 text-center">Avg</th>
                    <th className="p-3 text-center">SR</th>
                    <th className="p-3 text-center">4s</th>
                    <th className="p-3 text-center">6s</th>
                    <th className="p-3 text-center">50</th>
                    <th className="p-3 text-center">100</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.filter(p => (perfByPlayer.get(p.id)?.length ?? 0) > 0).sort((a, b) => b.runs - a.runs).map((p, i) => {
                    const perfs = perfByPlayer.get(p.id) || []
                    const inns = perfs.length
                    const dismissals = perfs.filter(x => x.isOut).length || inns
                    const avg = dismissals > 0 ? (p.runs / dismissals).toFixed(2) : "-"
                    const hs = Math.max(...perfs.map(x => x.battingRuns), 0)
                    return (
                      <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                        <td className="p-3 text-center font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-[var(--muted-foreground)]">{season.teams.find(t => t.id === p.teamId)?.shortName}</td>
                        <td className="p-3 text-center">{p.matchesPlayed}</td>
                        <td className="p-3 text-center">{inns}</td>
                        <td className="p-3 text-center font-bold">{p.runs}</td>
                        <td className="p-3 text-center">{p.ballsFaced}</td>
                        <td className="p-3 text-center font-medium">{hs}</td>
                        <td className="p-3 text-center font-mono">{avg}</td>
                        <td className="p-3 text-center font-mono">{p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(1) : "-"}</td>
                        <td className="p-3 text-center text-blue-600">{p.fours}</td>
                        <td className="p-3 text-center text-purple-600">{p.sixes}</td>
                        <td className="p-3 text-center text-yellow-600">{p.fifties}</td>
                        <td className="p-3 text-center text-green-600">{p.hundreds}</td>
                      </tr>
                    )
                  })}
                  {allPlayers.filter(p => (perfByPlayer.get(p.id)?.length ?? 0) > 0).length === 0 && (
                    <tr><td colSpan={14} className="p-4 text-center text-[var(--muted-foreground)]">No batting data yet.</td></tr>
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
                    <th className="p-3 text-center">Wkts</th>
                    <th className="p-3 text-center">Runs</th>
                    <th className="p-3 text-center">BB</th>
                    <th className="p-3 text-center">Avg</th>
                    <th className="p-3 text-center">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {allPlayers.filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).map((p, i) => {
                    const perfs = perfByPlayer.get(p.id) || []
                    const inns = perfs.filter(x => x.ballsBowled > 0).length
                    const overs = Math.floor(p.ballsBowled / 6) + "." + (p.ballsBowled % 6)
                    const bestWkts = Math.max(...perfs.map(x => x.bowlingWickets), 0)
                    const bestRuns = perfs.filter(x => x.bowlingWickets === bestWkts).reduce((min, x) => Math.min(min, x.bowlingRuns), Infinity)
                    const bb = bestWkts > 0 ? `${bestWkts}/${bestRuns}` : "-"
                    const avg = p.wickets > 0 ? (p.runsConceded / p.wickets).toFixed(2) : "-"
                    return (
                      <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                        <td className="p-3 text-center font-medium text-[var(--muted-foreground)]">{i + 1}</td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-[var(--muted-foreground)]">{season.teams.find(t => t.id === p.teamId)?.shortName}</td>
                        <td className="p-3 text-center">{p.matchesPlayed}</td>
                        <td className="p-3 text-center">{inns}</td>
                        <td className="p-3 text-center font-mono">{overs}</td>
                        <td className="p-3 text-center font-bold text-green-600">{p.wickets}</td>
                        <td className="p-3 text-center">{p.runsConceded}</td>
                        <td className="p-3 text-center font-medium">{bb}</td>
                        <td className="p-3 text-center font-mono">{avg}</td>
                        <td className="p-3 text-center font-mono">{p.ballsBowled > 0 ? (p.runsConceded / (p.ballsBowled / 6)).toFixed(2) : "-"}</td>
                      </tr>
                    )
                  })}
                  {allPlayers.filter(p => p.wickets > 0).length === 0 && (
                    <tr><td colSpan={11} className="p-4 text-center text-[var(--muted-foreground)]">No bowling data yet.</td></tr>
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
