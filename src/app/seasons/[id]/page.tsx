import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      teams: true,
      matches: {
        orderBy: { date: "asc" },
        include: { team1: true, team2: true },
      },
    },
  })

  if (!season) notFound()

  const standings = season.teams.map((team) => {
    let won = 0, lost = 0, tied = 0, nr = 0
    const teamMatches = season.matches.filter(
      (m) => (m.team1Id === team.id || m.team2Id === team.id) && m.status === "completed"
    )
    for (const m of teamMatches) {
      const teamName = team.name.toLowerCase()
      const resultLower = m.result.toLowerCase()
      if (resultLower.includes("won")) {
        if (resultLower.includes(teamName)) won++
        else lost++
      } else if (resultLower.includes("tied")) tied++
      else if (resultLower === "no result" || resultLower.includes("no result")) nr++
    }
    return {
      id: team.id,
      name: team.shortName,
      color: team.color,
      played: teamMatches.length,
      won, lost, tied, nr,
      points: won * 2 + tied * 1 + nr * 1,
    }
  })
  standings.sort((a, b) => b.points - a.points)

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
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-8 w-8 rounded-full" style={{ backgroundColor: match.team1.color }} />
                    <span className="font-medium">{match.team1.shortName}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {new Date(match.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                    <div className="my-1 text-xs font-bold text-[var(--accent)]">VS</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{match.venue}</div>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-3">
                    <span className="font-medium">{match.team2.shortName}</span>
                    <div className="h-8 w-8 rounded-full" style={{ backgroundColor: match.team2.color }} />
                  </div>
                </div>
                {match.status === "completed" && match.result && (
                  <div className="mt-2 text-center text-sm font-medium text-green-600">{match.result}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default SeasonDetailPage
