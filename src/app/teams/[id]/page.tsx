import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: true,
      matches1: { include: { team1: true, team2: true } },
      matches2: { include: { team1: true, team2: true } },
    },
  })

  if (!team) notFound()

  const allMatches = [...team.matches1, ...team.matches2]
    .filter((m) => m.status !== "upcoming")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center gap-6">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ backgroundColor: team.color }}
        >
          {team.shortName}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-[var(--muted-foreground)]">{team.players.length} Players | {allMatches.length} Matches</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Players</h2>
        {team.players.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">No players added yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-all hover:border-[var(--accent)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-bold text-[var(--accent)]">
                  {player.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{player.role}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-4 text-xl font-semibold">Recent Matches</h2>
      {allMatches.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No matches played yet.</p>
      ) : (
        <div className="space-y-3">
          {allMatches.slice(0, 10).map((m) => (
            <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.team1.shortName}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{m.team1Score}</span>
                </div>
                <span className="text-xs font-semibold text-[var(--accent)]">VS</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted-foreground)]">{m.team2Score}</span>
                  <span className="font-medium">{m.team2.shortName}</span>
                </div>
              </div>
              <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{m.result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamDetailPage
