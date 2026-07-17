import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { relativeDateLabel, getVenueMapsUrl } from "@/lib/utils"

export const revalidate = 300

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
    .filter(match => new Date(match.date) < new Date("2026-08-16T00:00:00.000Z"))
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
                {player.photo && player.photo !== "/placeholder-player.svg" ? (
                  <img src={player.photo} alt={player.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <img src="/placeholder-player.svg" alt={player.name} className="h-10 w-10 rounded-full bg-[var(--muted)] p-2" />
                )}
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{player.role}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <details className="group rounded-xl border border-[var(--border)] bg-[var(--card)]" open>
        <summary className="flex cursor-pointer items-center justify-between p-4 text-lg font-semibold hover:bg-[var(--muted)]/50">
          <span>Matches {team.season ? `(${team.season.name})` : ""}</span>
          <span className="text-xs text-[var(--muted-foreground)] group-open:hidden">Show</span>
          <span className="text-xs text-[var(--muted-foreground)] hidden group-open:inline">Hide</span>
        </summary>
        <div className="px-4 pb-4">
      {allMatches.length === 0 ? (
        <p className="text-[var(--muted-foreground)] py-4 text-center">No matches yet.</p>
      ) : (
        <div className="space-y-3">
          {allMatches.map((match) => (
            <div key={match.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
              {match.matchNo > 0 && <div className="-mt-1 mb-1 text-[10px] font-semibold text-[var(--accent)]">Match {match.matchNo}</div>}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex shrink-0 items-center gap-1.5">
                    {match.team1.logo && <img src={match.team1.logo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
                    <span className="truncate text-sm font-medium">{match.team1.name}</span>
                  </div>
                  {match.team1Score && <span className="shrink-0 text-xs font-semibold text-[var(--foreground)]">{match.team1Score}</span>}
                </div>
                <div className="shrink-0 text-center">
                  <span className="text-xs font-semibold text-[var(--accent)]">VS</span>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {(() => { const rel = relativeDateLabel(new Date(match.date)); return rel.label ? <span className={rel.className}>{rel.label}</span> : <>{new Date(match.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })}</>; })()} &middot;{" "}
                    {new Date(match.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  {match.team2Score && <span className="shrink-0 text-xs font-semibold text-[var(--foreground)]">{match.team2Score}</span>}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{match.team2.name}</span>
                    {match.team2.logo && <img src={match.team2.logo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
                  </div>
                </div>
              </div>
              {match.result && <p className="mt-1 text-center text-xs font-medium text-green-600 dark:text-green-400">{match.result}</p>}
              {match.status === "upcoming" && <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">{(venue => { const url = getVenueMapsUrl(venue); return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] underline underline-offset-2">{venue}</a> : <>{venue}</> })(match.venue)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </details>
    </div>
  )
}

export default TeamDetailPage
