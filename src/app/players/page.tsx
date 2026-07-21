import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PlayersList } from "@/components/PlayersList"
import { AutoRefresh } from "@/components/AutoRefresh"

export const dynamic = "force-dynamic"

async function PlayersPage() {
  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      include: { team: true },
      orderBy: { runs: "desc" },
    }),
    prisma.team.findMany({ select: { id: true, shortName: true, name: true } }),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Players <span className="text-lg font-normal text-[var(--muted-foreground)]">({players.length})</span></h1>
          <p className="text-[var(--muted-foreground)]">All players in the Green Stars Cricket League</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teams/stats" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--muted)]">Team Stats</Link>
          <Link href="/players/stats" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:opacity-90">Top Stats</Link>
        </div>
      </div>
      <AutoRefresh interval={30000} />
      <PlayersList players={players.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        runs: p.runs,
        wickets: p.wickets,
        matchesPlayed: p.matchesPlayed,
        photo: p.photo,
        team: p.team ? { shortName: p.team.shortName, logo: p.team.logo } : null,
      }))} teams={teams} />
    </div>
  )
}

export default PlayersPage
