import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId, WORKSPACE_PRACTICE, WORKSPACE_OFFICIAL } from "@/lib/workspace"
import { PracticeCenterClient } from "@/components/PracticeCenterClient"

export const dynamic = "force-dynamic"

async function AdminPracticePage() {
  const workspaceId = await getCurrentWorkspaceId()

  const [officialSeasons, practiceMatches] = await Promise.all([
    prisma.season.findMany({ where: { workspaceId: WORKSPACE_OFFICIAL }, select: { id: true, name: true, year: true, isActive: true }, orderBy: { year: "desc" } }),
    prisma.match.findMany({
      where: { season: { workspaceId: WORKSPACE_PRACTICE } },
      include: { team1: { select: { name: true, shortName: true } }, team2: { select: { name: true, shortName: true } }, season: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Practice / Training Center</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">
        Clone the official season, run unlimited practice matches, then promote a well-rehearsed setup to the official season.
      </p>
      <PracticeCenterClient
        initialWorkspace={workspaceId}
        officialSeasons={officialSeasons as any[]}
        practiceMatches={practiceMatches as any[]}
      />
    </div>
  )
}

export default AdminPracticePage
