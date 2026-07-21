import { prisma } from "@/lib/prisma"
import { AdminPlayerForm } from "@/components/AdminPlayerForm"
import { AdminPlayerEdit } from "@/components/AdminPlayerEdit"
import { AdminDeleteButton } from "@/components/AdminDeleteButton"
import { Trophy } from "lucide-react"

export const dynamic = "force-dynamic"

function perfScore(player: { runs: number; ballsFaced: number; matchesPlayed: number; wickets: number; runsConceded: number; ballsBowled: number }): { batting: number; bowling: number } {
  const rpm = player.matchesPlayed > 0 ? player.runs / player.matchesPlayed : 0
  const sr = player.ballsFaced > 0 ? (player.runs / player.ballsFaced) * 100 : 0
  const batting = Math.min(100, Math.round(((rpm / 40) * 100 + (sr / 200) * 100) / 2))
  const wpm = player.matchesPlayed > 0 ? player.wickets / player.matchesPlayed : 0
  const econ = player.ballsBowled > 0 ? player.runsConceded / (player.ballsBowled / 6) : 12
  const bowling = Math.min(100, Math.round(((wpm / 3) * 100 + Math.max(0, (12 - econ) / 12) * 100) / 2))
  return { batting, bowling }
}

async function AdminPlayersPage() {
  const [allPlayers, teams] = await Promise.all([
    prisma.player.findMany({ include: { team: true }, orderBy: [{ teamId: "asc" }, { runs: "desc" }] }),
    prisma.team.findMany({ select: { id: true, name: true, shortName: true, captainName: true, logo: true } }),
  ])

  const teamMap = new Map(teams.map(t => [t.id, t]))
  const grouped = new Map<string, typeof allPlayers>()
  for (const p of allPlayers) {
    const g = grouped.get(p.teamId) || []
    g.push(p)
    grouped.set(p.teamId, g)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Players</h1>
        <a href="/api/export/players" className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)]">Download CSV</a>
      </div>
      <div className="mb-8"><AdminPlayerForm /></div>

      {teams.map(team => {
        const players = grouped.get(team.id) || []
        if (players.length === 0) return null
        return (
          <div key={team.id} className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--muted)] px-5 py-3">
              {team.logo && <img src={team.logo} alt="" className="h-7 w-7 rounded-full object-cover" />}
              <div>
                <h2 className="font-semibold">{team.name} ({team.shortName})</h2>
                <p className="text-xs text-[var(--muted-foreground)]">{players.length} players</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                    <th className="p-3 text-left">Player</th>
                    <th className="p-3 text-center">Role</th>
                    <th className="p-3 text-center">Batting<br />Runs</th>
                    <th className="p-3 text-center">Wkts</th>
                    <th className="p-3 text-center">Mat</th>
                    <th className="p-3 text-center">Bat%</th>
                    <th className="p-3 text-center">Bowl%</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => {
                    const { batting, bowling } = perfScore(p)
                    const batColor = batting >= 70 ? "bg-blue-500" : batting >= 40 ? "bg-blue-400" : "bg-blue-300"
                    const bowlColor = bowling >= 70 ? "bg-purple-500" : bowling >= 40 ? "bg-purple-400" : "bg-purple-300"
                    return (
                      <tr key={p.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {p.photo && p.photo !== "/placeholder-player.svg" ? (
                              <img src={p.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                            ) : <img src="/placeholder-player.svg" alt="" className="h-7 w-7 rounded-full bg-[var(--muted)] p-1" />}
                            <div>
                              <div className="flex items-center gap-1 font-medium">
                                {p.name}
                                {p.isCaptain && <Trophy className="h-3.5 w-3.5 text-amber-500" aria-label="Captain" />}
                              </div>
                              <p className="text-[10px] text-[var(--muted-foreground)]">{p.battingStyle} &middot; {p.bowlingStyle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">{p.role}</td>
                        <td className="p-3 text-center font-medium">{p.runs}</td>
                        <td className="p-3 text-center font-medium">{p.wickets}</td>
                        <td className="p-3 text-center">{p.matchesPlayed}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--muted)] sm:w-20">
                              <div className={`h-full rounded-full transition-all ${batColor}`} style={{ width: `${batting}%` }} />
                            </div>
                            <span className="w-6 text-right text-xs font-mono">{batting}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--muted)] sm:w-20">
                              <div className={`h-full rounded-full transition-all ${bowlColor}`} style={{ width: `${bowling}%` }} />
                            </div>
                            <span className="w-6 text-right text-xs font-mono">{bowling}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <AdminPlayerEdit player={p as any} teams={teams} />
                            <AdminDeleteButton api="/api/players" id={p.id} label="player" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
      {allPlayers.length === 0 && <p className="text-center py-8 text-[var(--muted-foreground)]">No players yet.</p>}
    </div>
  )
}

export default AdminPlayersPage
