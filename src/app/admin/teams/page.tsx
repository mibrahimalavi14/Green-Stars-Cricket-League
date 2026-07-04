import { prisma } from "@/lib/prisma"
import { AdminTeamForm } from "@/components/AdminTeamForm"

async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({ include: { _count: { select: { players: true } }, season: true } })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Manage Teams</h1>
      <div className="mb-8"><AdminTeamForm /></div>
      <div className="space-y-3">
        {teams.map((t) => (
          <div key={t.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-[var(--muted)] text-sm font-bold" style={{ backgroundColor: t.color }}>
                  {t.logo && !t.logo.includes("placeholder") ? (
                    <img src={t.logo} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-white">{t.shortName}</span>
                  )}
                </span>
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{t._count.players} players</p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
              {t.captainName && <span>Captain: {t.captainName}</span>}
              {t.headCoach && <span>Coach: {t.headCoach}</span>}
              {t.location && <span>Location: {t.location}</span>}
              {t.season && <span>Season: {t.season.name}</span>}
            </div>
          </div>
        ))}
        {teams.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No teams yet.</p>}
      </div>
    </div>
  )
}

export default AdminTeamsPage
