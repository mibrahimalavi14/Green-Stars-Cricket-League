import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface Tally {
  name: string
  count: number
  seasons: string[]
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })
}

function LeaderboardPanel({
  title,
  icon,
  items,
  accent,
}: {
  title: string
  icon: string
  items: Tally[]
  accent: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span>{icon}</span> {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No data yet.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((t, i) => (
            <li key={t.name} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? accent : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">{t.seasons.join(", ")}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold">{t.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

async function SeasonsPage() {
  const [seasons, workspace] = await Promise.all([
    prisma.season.findMany({
      orderBy: { year: "desc" },
      include: {
        teams: { select: { id: true, name: true } },
        matches: { select: { date: true }, orderBy: { date: "asc" } },
        awards: { where: { category: "mvp" }, select: { playerId: true } },
      },
    }),
    prisma.workspace.findUnique({ where: { id: "official" }, select: { titlesLeaderboardVisible: true } }),
  ])
  const leaderboardVisible = workspace?.titlesLeaderboardVisible ?? true

  const mvpPlayerIds = [...new Set(seasons.flatMap(s => s.awards.filter(a => a.playerId).map(a => a.playerId)))]
  const mvpPlayers = mvpPlayerIds.length
    ? await prisma.player.findMany({ where: { id: { in: mvpPlayerIds } }, select: { id: true, name: true } })
    : []
  const mvpPlayerMap = new Map(mvpPlayers.map(p => [p.id, p.name]))

  const titleMap = new Map<string, Tally>()
  const runnerUpMap = new Map<string, Tally>()

  const seasonSummaries = seasons.map(s => {
    const winner = s.winnerId ? s.teams.find(t => t.id === s.winnerId) : null
    const runnerUp = s.runnerUpId ? s.teams.find(t => t.id === s.runnerUpId) : null
    const mvpAward = s.awards[0]
    const mvpName = mvpAward?.playerId ? mvpPlayerMap.get(mvpAward.playerId) || null : null
    const dates = s.matches.map(m => m.date)
    const dateStart = dates.length > 0 ? dates[0] : null
    const dateEnd = dates.length > 0 ? dates[dates.length - 1] : null

    if (winner) {
      const t = titleMap.get(winner.name) || { name: winner.name, count: 0, seasons: [] }
      t.count++
      t.seasons.push(s.name)
      titleMap.set(winner.name, t)
    }
    if (runnerUp) {
      const t = runnerUpMap.get(runnerUp.name) || { name: runnerUp.name, count: 0, seasons: [] }
      t.count++
      t.seasons.push(s.name)
      runnerUpMap.set(runnerUp.name, t)
    }

    return { season: s, winner, runnerUp, mvpName, dateStart, dateEnd }
  })

  const titles = [...titleMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const runnerUps = [...runnerUpMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Seasons</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Browse all seasons of the Green Stars Cricket League.</p>

      {(leaderboardVisible && (titles.length > 0 || runnerUps.length > 0)) && (
        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          <LeaderboardPanel title="Most Titles" icon="🏆" items={titles} accent="bg-amber-500/20 text-amber-600 dark:text-amber-400" />
          <LeaderboardPanel title="Most Runner-up Finishes" icon="🥈" items={runnerUps} accent="bg-slate-400/20 text-slate-500" />
        </div>
      )}

      {seasons.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No seasons yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seasonSummaries.map(({ season, winner, runnerUp, mvpName, dateStart, dateEnd }, i) => (
            <Link
              key={season.id}
              href={`/seasons/${season.id}`}
              className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:shadow-lg"
            >
              <h2 className="mb-1 text-xl font-bold group-hover:text-[var(--accent)]">{season.name}</h2>
              <p className="mb-3 text-sm text-[var(--muted-foreground)]">{season.year}</p>

              {dateStart && dateEnd && (
                <p className="mb-1 text-xs text-[var(--muted-foreground)]">
                  📅 {fmtDate(dateStart)}{dateEnd > dateStart ? ` – ${fmtDate(dateEnd)}` : ""}
                </p>
              )}
              {winner && (
                <p className="mb-1 text-xs text-amber-600 dark:text-amber-400">🏆 Winner: {winner.name}</p>
              )}
              {runnerUp && (
                <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">🥈 Runner-up: {runnerUp.name}</p>
              )}
              {mvpName && (
                <p className="mb-1 text-xs text-green-600 dark:text-green-400">🏅 Player of the Tournament: {mvpName}</p>
              )}

              <div className="mt-auto flex justify-between pt-4 text-sm">
                <span>{season.teams.length} Teams</span>
                <span>{season.matches.length} Matches</span>
              </div>
              {season.isActive && (
                <span className="mt-3 inline-block w-fit rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeasonsPage
