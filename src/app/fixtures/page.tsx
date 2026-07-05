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

  const teams = await prisma.team.findMany({ select: { name: true, shortName: true, logo: true } })

  const upcoming = matches.filter((m) => m.status === "upcoming")
  const live = matches.filter((m) => m.status === "live")
  const completed = matches.filter((m) => m.status === "completed").reverse()

  function findTeam(name: string) {
    const n = name.toLowerCase().trim()
    return teams.find(t => t.name.toLowerCase() === n || t.shortName.toLowerCase() === n)
  }

  function parseScheduleLine(line: string) {
    const parts = line.split("—").map(s => s.trim())
    const teamsPart = parts[0]
    const datePart = parts[1] || ""
    const matchParts = teamsPart.split(":")
    const matchLabel = matchParts[0]?.trim() || ""
    const teamsNames = (matchParts[1] || teamsPart).split("vs").map(s => s.trim())
    const t1 = findTeam(teamsNames[0] || "")
    const t2 = findTeam(teamsNames[1] || "")
    return { matchLabel, t1, t2, date: datePart }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Fixtures & Results</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Complete schedule and results</p>

      {schedules.map((s) => {
        const lines = s.content.split("\n").filter(l => l.trim())
        return (
          <section key={s.id} className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">{s.title}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {lines.map((line, i) => {
                const parsed = parseScheduleLine(line)
                if (!parsed.t1 || !parsed.t2) {
                  return <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">{line}</div>
                }
                return (
                  <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>{parsed.matchLabel}</span>
                      <span>{parsed.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={parsed.t1.logo || ""} alt={parsed.t1.shortName} className="h-8 w-8 rounded-full object-cover" />
                        <span className="font-semibold">{parsed.t1.shortName}</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{parsed.t2.shortName}</span>
                        <img src={parsed.t2.logo || ""} alt={parsed.t2.shortName} className="h-8 w-8 rounded-full object-cover" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live Now
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {live.map((m) => <MatchCard key={m.id} match={m as never} />)}
          </div>
        </section>
      )}

      {matches.length > 0 && (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">No upcoming matches.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((m) => <MatchCard key={m.id} match={m as never} />)}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Results</h2>
            {completed.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">No completed matches.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completed.map((m) => <MatchCard key={m.id} match={m as never} />)}
              </div>
            )}
          </section>
        </>
      )}
      {matches.length === 0 && schedules.length === 0 && (
        <p className="text-center text-[var(--muted-foreground)] py-12">No fixtures scheduled yet.</p>
      )}
    </div>
  )
}

export default FixturesPage
