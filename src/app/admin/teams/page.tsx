import { prisma } from "@/lib/prisma"
import { AdminTeamForm } from "@/components/AdminTeamForm"

async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({ include: { _count: { select: { players: true } } } })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Manage Teams</h1>
      <div className="mb-8"><AdminTeamForm /></div>
      <div className="space-y-3">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: t.color }}>{t.shortName}</span>
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{t._count.players} players</p>
              </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No teams yet.</p>}
      </div>
    </div>
  )
}

export default AdminTeamsPage
