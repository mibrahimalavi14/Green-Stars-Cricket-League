import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function SeasonsPage() {
  const seasons = await prisma.season.findMany({ orderBy: { year: "desc" } })
  const teamCounts = await Promise.all(
    seasons.map((s) => prisma.team.count({ where: { seasonId: s.id } }))
  )
  const matchCounts = await Promise.all(
    seasons.map((s) => prisma.match.count({ where: { seasonId: s.id } }))
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Seasons</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Browse all seasons of the Green Stars Cricket League.</p>

      {seasons.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No seasons yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season, i) => (
            <Link
              key={season.id}
              href={`/seasons/${season.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:shadow-lg"
            >
              <h2 className="mb-1 text-xl font-bold group-hover:text-[var(--accent)]">{season.name}</h2>
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">{season.year}</p>
              <div className="flex justify-between text-sm">
                <span>{teamCounts[i]} Teams</span>
                <span>{matchCounts[i]} Matches</span>
              </div>
              {season.isActive && (
                <span className="mt-3 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeasonsPage
