import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { relativeDateLabel } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const revalidate = 10

async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: true,
      season: true,
      matches1: {
        include: { team1: true, team2: true, season: true },
        where: { seasonId: (await prisma.team.findUnique({ where: { id }, select: { seasonId: true } }))?.seasonId },
      },
      matches2: {
        include: { team1: true, team2: true, season: true },
        where: { seasonId: (await prisma.team.findUnique({ where: { id }, select: { seasonId: true } }))?.seasonId },
      },
    },
  })

  if (!team) notFound()

  const allMatches = [...team.matches1, ...team.matches2]
    .filter(m => new Date(m.date) < new Date("2026-08-28T00:00:00.000Z"))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)] overflow-hidden" style={{ backgroundColor: team.color }}>
          {team.logo && !team.logo.includes("placeholder") ? (
            <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">{team.shortName}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-[var(--muted-foreground)]">{team.players.length} Players | {allMatches.length} Matches</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {team.captainName && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">Captain</p>
            <p className="mt-1 font-semibold">{team.captainName}</p>
          </div>
        )}
        {team.headCoach && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">Head Coach</p>
            <p className="mt-1 font-semibold">{team.headCoach}</p>
          </div>
        )}
        {team.location && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
            <p className="text-xs text-[var(--muted-foreground)]">Location</p>
            <p className="mt-1 font-semibold">{team.location}</p>
          </div>
        )}
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

      <h2 className="mb-4 text-xl font-semibold">Matches {team.season ? `(${team.season.name})` : ""}</h2>
      {allMatches.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">No matches yet.</p>
      ) : (
        <div className="space-y-3">
          {allMatches.map((m) => (
            <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {m.team1.logo && <img src={m.team1.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                    <span className="font-medium">{m.team1.name}</span>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">{m.team1Score}</span>
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold text-[var(--accent)]">VS</span>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {(() => { const rel = relativeDateLabel(new Date(m.date)); return rel.label ? <span className={rel.className}>{rel.label}</span> : <>{new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                    {new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted-foreground)]">{m.team2Score}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{m.team2.name}</span>
                    {m.team2.logo && <img src={m.team2.logo} alt="" className="h-4 w-4 rounded-full object-cover" />}
                  </div>
                </div>
              </div>
              {m.result && <p className="mt-1 text-center text-xs font-medium text-green-600">{m.result}</p>}
              {m.status === "upcoming" && <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{m.venue}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TeamDetailPage
