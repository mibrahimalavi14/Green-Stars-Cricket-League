import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Trophy, Medal, Star } from "lucide-react"

export const dynamic = "force-dynamic"

async function PotmGalleryPage() {
  const all = await prisma.match.findMany({
    where: { status: "completed" },
    include: { team1: true, team2: true, season: true },
    orderBy: { date: "desc" },
  })
  const matches = all.filter(m => m.manOfMatch)

  const potmCount: Record<string, { count: number; lastMatch: typeof matches[0] }> = {}
  for (const m of matches) {
    const name = m.manOfMatch!
    if (!potmCount[name]) potmCount[name] = { count: 0, lastMatch: m }
    potmCount[name].count++
    if (m.date > potmCount[name].lastMatch.date) potmCount[name].lastMatch = m
  }

  const leaders = Object.entries(potmCount)
    .map(([name, data]) => ({ name, count: data.count, lastMatch: data.lastMatch }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Player of the Match Gallery</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">All Player of the Match award winners across seasons</p>

      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gscl-gold" />
          All-Time POTM Leaders
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gscl-gold/20 text-lg font-bold text-gscl-dark">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {p.count} Player of the Match award{p.count !== 1 ? "s" : ""}
                </p>
              </div>
              <Medal className="h-5 w-5 text-gscl-gold" />
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
        <Star className="h-5 w-5 text-gscl-gold" />
        All Awards
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gscl-gold/20">
                <Trophy className="h-5 w-5 text-gscl-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{m.manOfMatch}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
              {m.team1.logo && <img src={m.team1.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
              <span className="font-medium text-[var(--foreground)]">{m.team1.shortName}</span>
              <span>vs</span>
              {m.team2.logo && <img src={m.team2.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
              <span className="font-medium text-[var(--foreground)]">{m.team2.shortName}</span>
            </div>
            {m.result && <p className="mt-1 text-xs text-green-600 dark:text-green-400 truncate">{m.result}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default PotmGalleryPage
