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

  const upcoming = matches.filter((m) => m.status === "upcoming")
  const live = matches.filter((m) => m.status === "live")
  const completed = matches.filter((m) => m.status === "completed").reverse()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Fixtures & Results</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Complete schedule and results</p>

      {schedules.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Announcements</h2>
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="font-semibold">{s.title}</h3>
                {s.excerpt && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{s.excerpt}</p>}
                <div className="mt-2 text-sm whitespace-pre-line">{s.content}</div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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
