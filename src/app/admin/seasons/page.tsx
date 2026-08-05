import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { AdminSeasonForm } from "@/components/AdminSeasonForm"
import { PredictionLockToggle } from "@/components/PredictionLockToggle"
import { SeasonLockToggle } from "@/components/SeasonLockToggle"

export const dynamic = "force-dynamic"

async function AdminSeasonsPage() {
  const workspaceId = await getCurrentWorkspaceId()
  const seasons = await prisma.season.findMany({ where: { workspaceId }, orderBy: { year: "desc" } })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Manage Seasons</h1>
      <div className="mb-8"><AdminSeasonForm /></div>
      {seasons.map((s) => (
        <div key={s.id} className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{s.name} ({s.year})</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Active: {s.isActive ? "Yes" : "No"} | Schedule Announced: {s.scheduleAnnounced ? "Yes" : "No"}
              </p>
            </div>
          </div>
          <div className="mt-3"><PredictionLockToggle seasonId={s.id} locked={s.scheduleAnnounced} /></div>
          <SeasonLockToggle seasonId={s.id} locked={s.isLocked} reason={s.lockedReason} />
        </div>
      ))}
    </div>
  )
}

export default AdminSeasonsPage
