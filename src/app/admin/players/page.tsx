import { prisma } from "@/lib/prisma"
import { AdminPlayerForm } from "@/components/AdminPlayerForm"
import { AdminPlayerEdit } from "@/components/AdminPlayerEdit"

export const dynamic = "force-dynamic"

async function AdminPlayersPage() {
  const [players, teams] = await Promise.all([
    prisma.player.findMany({ include: { team: true }, orderBy: { runs: "desc" } }),
    prisma.team.findMany({ select: { id: true, name: true } }),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Players</h1>
        <a href="/api/export/players" className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm transition-colors hover:bg-[var(--muted)]">Download CSV</a>
      </div>
      <div className="mb-8"><AdminPlayerForm /></div>
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                {p.photo && p.photo !== "/placeholder-player.svg" ? (
                  <img src={p.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <img src="/placeholder-player.svg" alt="" className="h-8 w-8 rounded-full bg-[var(--muted)] p-1" />
                )}
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{p.role} &middot; {p.team?.shortName}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Bat: {p.battingStyle} &middot; Bowl: {p.bowlingStyle}</p>
                  </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>{p.runs} runs</span>
                  <span>{p.wickets} wkts</span>
                </div>
                <AdminPlayerEdit player={p as any} teams={teams} />
              </div>
            </div>
          </div>
        ))}
        {players.length === 0 && <p className="text-center py-8 text-[var(--muted-foreground)]">No players yet.</p>}
      </div>
    </div>
  )
}

export default AdminPlayersPage
