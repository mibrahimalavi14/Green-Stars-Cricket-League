import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const revalidate = 30

async function TeamsPage() {
  const teams = await prisma.team.findMany({
    include: { _count: { select: { players: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Teams</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Meet the teams competing in Green Stars Cricket League</p>
      {teams.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)] py-12">No teams added yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] overflow-hidden" style={{ backgroundColor: team.color }}>
                  {team.logo && !team.logo.includes("placeholder") ? (
                    <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">{team.shortName}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-[var(--accent)]">{team.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{team._count.players} Players</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamsPage
