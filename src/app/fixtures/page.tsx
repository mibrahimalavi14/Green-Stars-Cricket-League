import { prisma } from "@/lib/prisma"
import { MatchCard } from "@/components/MatchCard"

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

  const groups: Record<string, typeof matches> = {}
  for (const m of upcoming) {
    const dateKey = new Date(m.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(m)
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
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Season 1 — Full Schedule</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">7 teams • 5-over format • Double Round Robin • 42 matches</p>

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
                          <img src={m.team1.logo || ""} alt={m.team1.shortName} className="h-7 w-7 rounded-full object-cover" />
                          <span className="text-sm font-medium">{m.team1.name}</span>
                        </div>
                        <span className="text-[10px] text-[var(--muted-foreground)]">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{m.team2.name}</span>
                          <img src={m.team2.logo || ""} alt={m.team2.shortName} className="h-7 w-7 rounded-full object-cover" />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                        <span>7:00 PM</span>
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
