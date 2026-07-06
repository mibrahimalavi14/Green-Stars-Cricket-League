import { prisma } from "@/lib/prisma"
import { MatchCard } from "@/components/MatchCard"

export const dynamic = "force-dynamic"

async function FixturesPage() {
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true },
    orderBy: { date: "asc" },
  })

  const schedules = await prisma.news.findMany({
    where: { published: true, type: "schedule" },
    orderBy: { createdAt: "desc" },
  })

  const live = matches.filter((m) => m.status === "live")
  const completed = matches.filter((m) => m.status === "completed").reverse()
  const upcoming = matches.filter((m) => m.status === "upcoming")
  const playoffCutoff = new Date("2026-08-28T00:00:00.000Z")
  const leagueUpcoming = upcoming.filter((m) => m.date < playoffCutoff)
  const playoffUpcoming = upcoming.filter((m) => m.date >= playoffCutoff)

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

  function playoffLabel(d: Date) {
    const iso = d.toISOString()
    if (iso.startsWith("2026-08-28T12:")) return "Qualifier 1"
    if (iso.startsWith("2026-08-28T13:")) return "Eliminator"
    if (iso.startsWith("2026-08-29T")) return "Qualifier 2"
    if (iso.startsWith("2026-08-30T")) return "Final"
    return ""
  }

  const playoffRoundLabels: Record<string, string> = {
    "28 August": "Qualifier 1 & Eliminator",
    "29 August": "Qualifier 2",
    "30 August": "Final",
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
    "1 August": "Round 8",
    "2 August": "Round 9",
    "8 August": "Round 10",
    "9 August": "Round 11",
    "15 August": "Round 12",
    "16 August": "Round 13",
    "22 August": "Round 14",
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Season 1 — Full Schedule</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">7 teams • 5-over format • Double Round Robin • 42 matches</p>

      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <p className="font-medium">Note: Starter Phase — Neutral Fielders</p>
        <p className="mt-1">During the starter phase of GSCL, players from non-participating teams may act as neutral fielders and wicketkeepers. Their fielding performances are recorded in the scorebook but do not affect their team's points or standings.</p>
      </div>

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
                  {dayMatches.map((m) => (
                    <div key={m.id} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 transition-colors hover:border-[var(--accent)]/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={m.team1.logo || ""} alt={m.team1.name} className="h-7 w-7 rounded-full object-cover" />
                          <span className="text-sm font-medium">{m.team1.name}</span>
                        </div>
                        <span className="text-[10px] text-[var(--muted-foreground)]">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{m.team2.name}</span>
                          <img src={m.team2.logo || ""} alt={m.team2.name} className="h-7 w-7 rounded-full object-cover" />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                        <span>{new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</span>
                        <span>{m.venue}</span>
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
            <h2 className="text-lg font-semibold text-amber-600">Playoffs</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Top 4 teams from the Points Table will qualify for the Playoffs.
            </p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {Object.entries(playoffGroups).map(([dateKey, dayMatches]) => {
              const dayNum = dateKey.match(/\d+/)?.[0] || ""
              const month = dateKey.match(/[A-Z]\w+/)?.[0] || ""
              const label = playoffRoundLabels[`${dayNum} ${month}`] || ""
              return (
                <div key={dateKey} className="px-6 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-600">
                      {weekDays[dateKey.split(",")[0]] || dateKey.split(",")[0].slice(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold">{dateKey}</p>
                      {label && <p className="text-xs font-medium text-amber-600">{label}</p>}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {dayMatches.map((m) => (
                      <div key={m.id} className="rounded-xl border border-amber-200 bg-[var(--background)] p-3 dark:border-amber-800/40">
                        <div className="mb-1">
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{playoffLabel(new Date(m.date))}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-sm font-bold text-amber-600">TBD</span>
                          </div>
                          <span className="text-[10px] text-amber-600">vs</span>
                          <div className="flex flex-1 items-center justify-end gap-2">
                            <span className="text-sm font-bold text-amber-600">TBD</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                          <span>{new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</span>
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
            {live.map((m) => <MatchCard key={m.id} match={m as never} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Results</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((m) => <MatchCard key={m.id} match={m as never} />)}
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
