import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const revalidate = 30

async function PlayersPage() {
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { runs: "desc" },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Players <span className="text-lg font-normal text-[var(--muted-foreground)]">({players.length})</span></h1>
          <p className="text-[var(--muted-foreground)]">All players in the Green Stars Cricket League</p>
        </div>
        <Link href="/players/stats" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:opacity-90">View Stats</Link>
      </div>
      {players.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)] py-12">No players added yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-3">
                {player.photo && player.photo !== "/placeholder-player.svg" ? (
                  <img src={player.photo} alt={player.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <img src="/placeholder-player.svg" alt={player.name} className="h-12 w-12 rounded-full bg-[var(--muted)] p-2" />
                )}
                <div>
                  <p className="font-semibold">{player.name}</p>
                  <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    {player.team?.logo && <img src={player.team.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                    {player.role} &middot; {player.team?.shortName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="font-bold">{player.runs}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Runs</p>
                </div>
                <div>
                  <p className="font-bold">{player.wickets}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]" title="Wickets">Wkts</p>
                </div>
                <div>
                  <p className="font-bold">{player.matchesPlayed}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Matches</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlayersPage
