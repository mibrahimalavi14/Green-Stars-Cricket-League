import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { WORKSPACE_OFFICIAL } from "@/lib/workspace"

export const metadata: Metadata = {
  title: "All-Time Stats | Green Stars Cricket League",
}

export const revalidate = 60

type StatRow = {
  matchesPlayed: number
  runs: number
  ballsFaced: number
  fours: number
  sixes: number
  fifties: number
  hundreds: number
  dismissals: number
  notOuts: number
  ducks: number
  wickets: number
  ballsBowled: number
  runsConceded: number
  maidens: number
  fiveWickets: number
  fourWickets: number
  hattricks: number
  wides: number
  noBalls: number
  catches: number
  stumpings: number
  runOuts: number
  teamId: string
}

type Totals = Omit<StatRow, "teamId">

function emptyTotals(): Totals {
  return {
    matchesPlayed: 0, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0,
    dismissals: 0, notOuts: 0, ducks: 0, wickets: 0, ballsBowled: 0, runsConceded: 0,
    maidens: 0, fiveWickets: 0, fourWickets: 0, hattricks: 0, wides: 0, noBalls: 0,
    catches: 0, stumpings: 0, runOuts: 0,
  }
}

function sumTotals(rows: StatRow[]): Totals {
  return rows.reduce((acc, r) => {
    acc.matchesPlayed += r.matchesPlayed
    acc.runs += r.runs
    acc.ballsFaced += r.ballsFaced
    acc.fours += r.fours
    acc.sixes += r.sixes
    acc.fifties += r.fifties
    acc.hundreds += r.hundreds
    acc.dismissals += r.dismissals
    acc.notOuts += r.notOuts
    acc.ducks += r.ducks
    acc.wickets += r.wickets
    acc.ballsBowled += r.ballsBowled
    acc.runsConceded += r.runsConceded
    acc.maidens += r.maidens
    acc.fiveWickets += r.fiveWickets
    acc.fourWickets += r.fourWickets
    acc.hattricks += r.hattricks
    acc.wides += r.wides
    acc.noBalls += r.noBalls
    acc.catches += r.catches
    acc.stumpings += r.stumpings
    acc.runOuts += r.runOuts
    return acc
  }, emptyTotals())
}

export default async function StatsPage() {
  const [seasons, teams, players] = await Promise.all([
    prisma.season.findMany({
      where: { workspaceId: WORKSPACE_OFFICIAL },
      select: { id: true, name: true, year: true, isActive: true },
      orderBy: { year: "desc" },
    }),
    prisma.team.findMany({
      where: { season: { workspaceId: WORKSPACE_OFFICIAL } },
      select: { id: true, seasonId: true },
    }),
    prisma.player.findMany({
      where: { team: { season: { workspaceId: WORKSPACE_OFFICIAL } } },
      select: {
        matchesPlayed: true, runs: true, ballsFaced: true, fours: true, sixes: true,
        fifties: true, hundreds: true, dismissals: true, notOuts: true, ducks: true,
        wickets: true, ballsBowled: true, runsConceded: true, maidens: true,
        fiveWickets: true, fourWickets: true, hattricks: true, wides: true, noBalls: true,
        catches: true, stumpings: true, runOuts: true, teamId: true,
      },
    }),
  ])

  const rows = players as unknown as StatRow[]
  const teamSeason = new Map(teams.map(t => [t.id, t.seasonId]))

  const allTime = sumTotals(rows)

  const bySeason = new Map<string, StatRow[]>()
  for (const r of rows) {
    const seasonId = teamSeason.get(r.teamId)
    if (!seasonId) continue
    const list = bySeason.get(seasonId) ?? []
    list.push(r)
    bySeason.set(seasonId, list)
  }

  const seasonTotals = seasons
    .map(s => ({ season: s, totals: sumTotals(bySeason.get(s.id) ?? []) }))
    .filter(s => s.totals.runs > 0 || s.totals.wickets > 0 || s.totals.matchesPlayed > 0)

  const activeSeason = seasons.find(s => s.isActive)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">All-Time Stats</h1>
        <p className="text-[var(--muted-foreground)]">
          League totals across all seasons — runs, balls, sixes, fours, wickets aur bahut kuch.
        </p>
      </div>

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">All-Time Totals</h2>
          <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
            {seasons.length} {seasons.length === 1 ? "season" : "seasons"} combined
          </span>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Player Appearances" value={allTime.matchesPlayed} color="slate" />
          <StatCard label="Total Runs" value={allTime.runs} color="orange" />
          <StatCard label="Total Balls Faced" value={allTime.ballsFaced} color="cyan" />
          <StatCard label="Total Wickets" value={allTime.wickets} color="green" />
        </div>

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Batting</h3>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Runs" value={allTime.runs} color="orange" />
          <StatCard label="Balls Faced" value={allTime.ballsFaced} color="cyan" />
          <StatCard label="Fours" value={allTime.fours} color="blue" />
          <StatCard label="Sixes" value={allTime.sixes} color="purple" />
          <StatCard label="Fifties" value={allTime.fifties} color="yellow" />
          <StatCard label="Hundreds" value={allTime.hundreds} color="green" />
          <StatCard label="Batting Average" value={allTime.dismissals > 0 ? (allTime.runs / allTime.dismissals).toFixed(2) : "-"} color="amber" />
          <StatCard label="Strike Rate" value={allTime.ballsFaced > 0 ? ((allTime.runs / allTime.ballsFaced) * 100).toFixed(2) : "-"} color="red" />
          <StatCard label="Balls per Boundary" value={allTime.fours + allTime.sixes > 0 ? (allTime.ballsFaced / (allTime.fours + allTime.sixes)).toFixed(1) : "-"} color="violet" />
          <StatCard label="Not Outs" value={allTime.notOuts} color="slate" />
          <StatCard label="Ducks" value={allTime.ducks} color="slate" />
          <StatCard label="Dismissals" value={allTime.dismissals} color="slate" />
        </div>

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Bowling</h3>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Wickets" value={allTime.wickets} color="green" />
          <StatCard label="Balls Bowled" value={allTime.ballsBowled} color="cyan" />
          <StatCard label="Runs Conceded" value={allTime.runsConceded} color="red" />
          <StatCard label="Maidens" value={allTime.maidens} color="blue" />
          <StatCard label="Economy Rate" value={allTime.ballsBowled > 0 ? (allTime.runsConceded / (allTime.ballsBowled / 6)).toFixed(2) : "-"} color="amber" />
          <StatCard label="5-Wicket Hauls" value={allTime.fiveWickets} color="violet" />
          <StatCard label="4-Wicket Hauls" value={allTime.fourWickets} color="purple" />
          <StatCard label="Hattricks" value={allTime.hattricks} color="red" />
        </div>

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Fielding & Extras</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Catches" value={allTime.catches} color="orange" />
          <StatCard label="Stumpings" value={allTime.stumpings} color="cyan" />
          <StatCard label="Run Outs" value={allTime.runOuts} color="blue" />
          <StatCard label="Wides" value={allTime.wides} color="yellow" />
          <StatCard label="No Balls" value={allTime.noBalls} color="purple" />
          <StatCard label="Boundaries" value={allTime.fours + allTime.sixes} color="green" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Season-Wise Totals</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="p-3 text-left">Season</th>
                <th className="p-3 text-center" title="Player Appearances">Apps</th>
                <th className="p-3 text-center">Runs</th>
                <th className="p-3 text-center" title="Balls Faced">BF</th>
                <th className="p-3 text-center" title="Fours">4s</th>
                <th className="p-3 text-center" title="Sixes">6s</th>
                <th className="p-3 text-center">50s</th>
                <th className="p-3 text-center">100s</th>
                <th className="p-3 text-center">Avg</th>
                <th className="p-3 text-center" title="Strike Rate">SR</th>
                <th className="p-3 text-center">Wkts</th>
                <th className="p-3 text-center" title="Balls Bowled">BB</th>
                <th className="p-3 text-center" title="Runs Conceded">RC</th>
                <th className="p-3 text-center">Econ</th>
                <th className="p-3 text-center">Catches</th>
                <th className="p-3 text-center" title="Stumpings">St</th>
                <th className="p-3 text-center" title="Run Outs">RO</th>
              </tr>
            </thead>
            <tbody>
              {seasonTotals.length === 0 ? (
                <tr><td colSpan={17} className="p-6 text-center text-[var(--muted-foreground)]">No season data yet.</td></tr>
              ) : seasonTotals.map(({ season, totals }) => (
                <tr key={season.id} className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)] ${season.isActive ? "bg-[var(--accent)]/5" : ""}`}>
                  <td className="p-3">
                    <Link href={`/seasons/${season.id}`} className="font-medium hover:text-[var(--accent)]">
                      {season.name}
                    </Link>
                    {season.isActive && <span className="ml-2 rounded-full bg-green-600/15 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">ACTIVE</span>}
                  </td>
                  <td className="p-3 text-center">{totals.matchesPlayed}</td>
                  <td className="p-3 text-center font-bold text-orange-600 dark:text-orange-400">{totals.runs}</td>
                  <td className="p-3 text-center">{totals.ballsFaced}</td>
                  <td className="p-3 text-center text-blue-600 dark:text-blue-400">{totals.fours}</td>
                  <td className="p-3 text-center text-purple-600 dark:text-purple-400">{totals.sixes}</td>
                  <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">{totals.fifties}</td>
                  <td className="p-3 text-center text-green-600 dark:text-green-400">{totals.hundreds}</td>
                  <td className="p-3 text-center font-mono">{totals.dismissals > 0 ? (totals.runs / totals.dismissals).toFixed(1) : "-"}</td>
                  <td className="p-3 text-center font-mono">{totals.ballsFaced > 0 ? ((totals.runs / totals.ballsFaced) * 100).toFixed(0) : "-"}</td>
                  <td className="p-3 text-center font-bold text-green-600 dark:text-green-400">{totals.wickets}</td>
                  <td className="p-3 text-center">{totals.ballsBowled}</td>
                  <td className="p-3 text-center">{totals.runsConceded}</td>
                  <td className="p-3 text-center font-mono">{totals.ballsBowled > 0 ? (totals.runsConceded / (totals.ballsBowled / 6)).toFixed(2) : "-"}</td>
                  <td className="p-3 text-center">{totals.catches}</td>
                  <td className="p-3 text-center">{totals.stumpings}</td>
                  <td className="p-3 text-center">{totals.runOuts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeSeason && (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            {activeSeason.name} currently ongoing — totals update as matches complete.
          </p>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    slate: "text-slate-600 dark:text-slate-400",
    orange: "text-orange-600 dark:text-orange-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center transition-colors hover:bg-[var(--muted)]">
      <div className={`text-2xl font-bold ${colorMap[color] || colorMap.slate}`}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </div>
      <div className="mt-1 text-xs text-[var(--muted-foreground)]">{label}</div>
    </div>
  )
}
