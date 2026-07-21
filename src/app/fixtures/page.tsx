import { prisma } from "@/lib/prisma"
import { MatchCard } from "@/components/MatchCard"
import { getVenueMapsUrl } from "@/lib/utils"
import { Breadcrumbs } from "@/components/Breadcrumbs"

export const revalidate = 300

async function FixturesPage() {
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true },
    orderBy: { date: "asc" },
  })

  const schedules = await prisma.news.findMany({
    where: { published: true, type: "schedule" },
    orderBy: { createdAt: "desc" },
  })

  const live = matches.filter((match) => match.status === "live")
  const completed = matches.filter((match) => match.status === "completed").reverse()
  const upcoming = matches.filter((match) => match.status === "upcoming")

  const leagueUpcoming = upcoming.filter((match) => match.stage === "league")
  const playoffUpcoming = upcoming.filter((match) => match.stage !== "league")

  const groups: Record<string, typeof matches> = {}
  for (const m of leagueUpcoming) {
    const dateKey = new Date(m.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(m)
  }

  const playoffGroups: Record<string, typeof matches> = {}
  for (const m of playoffUpcoming) {
    const dateKey = new Date(m.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    if (!playoffGroups[dateKey]) playoffGroups[dateKey] = []
    playoffGroups[dateKey].push(m)
  }

  function stageLabel(stage: string): string {
    return stage === "qualifier1" ? "Qualifier 1" :
           stage === "qualifier2" ? "Qualifier 2" :
           stage === "eliminator" ? "Eliminator" :
           stage === "final" ? "Final" : stage
  }

  const weekDays: Record<string, string> = {
    "Friday": "Fri",
    "Saturday": "Sat",
    "Sunday": "Sun",
  }

  const roundLabels: Record<string, string> = {
    "17 July": "Round 1",
    "18 July": "Round 2",
    "19 July": "Round 3",
    "24 July": "Round 4",
    "25 July": "Round 5",
    "26 July": "Round 6",
    "31 July": "Round 7",
    "2 August": "Round 8",
    "9 August": "Round 9",
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Breadcrumbs items={[{ label: "Fixtures" }]} />
      <h1 className="mb-2 text-3xl font-bold">Season 1 — Full Schedule</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">8 teams • 5-over format • Double Round Robin • 30 league matches</p>

      <div className="mb-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
          <h2 className="text-lg font-semibold">League Stage</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {Object.entries(groups).map(([dateKey, dayMatches]) => {
            const dayNum = dateKey.match(/\d+/)?.[0] || ""
            const month = dateKey.match(/[A-Z]\w+/)?.[0] || ""
            const roundLabel = roundLabels[`${dayNum} ${month}`] || ""
            return (
              <div key={dateKey} className="px-6 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                    {weekDays[dateKey.split(",")[0]] || dateKey.split(",")[0].slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold">{dateKey}</p>
                    {roundLabel && <p className="text-xs text-[var(--muted-foreground)]">{roundLabel}</p>}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {dayMatches.map((match) => (
                    <div key={match.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 transition-colors hover:border-[var(--accent)]/30">
                      {match.matchNo > 0 && <div className="mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {match.matchNo}</div>}
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {match.team1.logo ? <img src={match.team1.logo} alt={match.team1.name} className="h-7 w-7 shrink-0 rounded-full object-cover" /> : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: match.team1.color }}>{match.team1.shortName?.charAt(0)}</div>}
                          <span className="truncate text-sm font-medium">{match.team1.name}</span>
                        </div>
                        <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">vs</span>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium">{match.team2.name}</span>
                          {match.team2.logo ? <img src={match.team2.logo} alt={match.team2.name} className="h-7 w-7 shrink-0 rounded-full object-cover" /> : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: match.team2.color }}>{match.team2.shortName?.charAt(0)}</div>}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                        <span>{new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</span>
                        <span>{(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {playoffUpcoming.length > 0 && (
        <div className="mb-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
            <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400">Playoffs</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Top 4 teams from the Points Table will qualify for the Playoffs.
            </p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {Object.entries(playoffGroups).map(([dateKey, dayMatches]) => {
              return (
                <div key={dateKey} className="px-6 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-600 dark:text-amber-400">
                      {weekDays[dateKey.split(",")[0]] || dateKey.split(",")[0].slice(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold">{dateKey}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {dayMatches.map((match) => (
                      <div key={match.id} className="rounded-xl border border-amber-200 bg-[var(--background)] p-3 dark:border-amber-800/40">
                        {match.matchNo > 0 && <div className="mb-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Match {match.matchNo}</div>}
                        <div className="mb-1">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{stageLabel(match.stage)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">TBD</span>
                          </div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">vs</span>
                          <div className="flex flex-1 items-center justify-end gap-2">
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">TBD</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                          <span>{new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</span>
                          <span>TBD</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {live.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live Now
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {live.map((match) => <MatchCard key={match.id} match={match as any} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Results</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((match) => <MatchCard key={match.id} match={match as any} />)}
          </div>
        </section>
      )}

      {matches.length === 0 && schedules.length === 0 && (
        <p className="text-center text-[var(--muted-foreground)] py-12">No fixtures scheduled yet.</p>
      )}
    </div>
  )
}

export default FixturesPage
