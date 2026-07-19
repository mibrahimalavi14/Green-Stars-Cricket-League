import { prisma } from "@/lib/prisma"
import { MapPin, Calendar, Users } from "lucide-react"
import Link from "next/link"

export const revalidate = 300

async function VenuesPage() {
  const matches = await prisma.match.findMany({
    include: { team1: true, team2: true, season: true },
    orderBy: { date: "desc" },
  })

  const venueMap = new Map<string, { total: number; completed: number; teams: Set<string>; matches: typeof matches }>()
  for (const m of matches) {
    const v = m.venue || "TBD"
    if (!venueMap.has(v)) venueMap.set(v, { total: 0, completed: 0, teams: new Set(), matches: [] })
    const entry = venueMap.get(v)!
    entry.total++
    if (m.status === "completed") entry.completed++
    entry.teams.add(m.team1.name)
    entry.teams.add(m.team2.name)
    entry.matches.push(m)
  }

  const venues = [...venueMap.entries()]
    .map(([name, data]) => ({ name, ...data, teamCount: data.teams.size, recentMatch: data.matches[0] }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Venues</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">All match venues in the Green Stars Cricket League</p>

      <div className="grid gap-6 md:grid-cols-2">
        {venues.map((venue) => (
          <div key={venue.name} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="h-48 w-full bg-[var(--muted)]">
              <iframe
                title={venue.name}
                src={`https://www.google.com/maps?q=${encodeURIComponent(venue.name + ", Haripur, Pakistan")}&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-5">
              <h2 className="mb-3 text-lg font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--accent)]" />
                {venue.name}
              </h2>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-lg bg-[var(--muted)] p-2">
                  <p className="text-lg font-bold">{venue.total}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Matches</p>
                </div>
                <div className="rounded-lg bg-[var(--muted)] p-2">
                  <p className="text-lg font-bold">{venue.completed}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Played</p>
                </div>
                <div className="rounded-lg bg-[var(--muted)] p-2">
                  <p className="text-lg font-bold">{venue.teamCount}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Teams</p>
                </div>
              </div>
              {venue.recentMatch && (
                <div className="rounded-lg bg-[var(--muted)] p-3 text-sm">
                  <p className="text-[10px] font-semibold text-[var(--muted-foreground)]">Most Recent Match</p>
                  <p className="font-medium">{venue.recentMatch.team1.name} vs {venue.recentMatch.team2.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {venue.recentMatch.season?.name} &middot;{" "}
                    {new Date(venue.recentMatch.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <Link href={`/matches/${venue.recentMatch.id}`} className="mt-1 inline-block text-xs text-[var(--accent)] hover:underline">
                    View Scorecard &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VenuesPage
