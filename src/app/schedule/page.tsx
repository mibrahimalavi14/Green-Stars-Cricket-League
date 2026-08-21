import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const { season: seasonId } = await searchParams
  const workspaceId = await getCurrentWorkspaceId()

  let season
  if (seasonId) {
    season = await prisma.season.findFirst({ where: { id: seasonId, workspaceId }, include: { teams: { select: { id: true, name: true, logo: true } } } })
  } else {
    season = await prisma.season.findFirst({ where: { isActive: true, workspaceId }, include: { teams: { select: { id: true, name: true, logo: true } } } })
  }

  if (!season || !season.scheduleAnnounced) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Match Schedule</h1>
        <p className="mt-4 text-[var(--muted-foreground)]">
          {season ? "Schedule will be announced soon. Stay tuned!" : "No active season. Schedule will appear here once available."}
        </p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-medium text-white hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Match Schedule</h1>
        <p className="text-[var(--muted-foreground)]">{season.name} ({season.year})</p>
      </div>

      {(() => {
        const teams = (season as any).teams || []
        if (teams.length === 0) return null
        return (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            {teams.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2">
                <img src={t.logo} alt={t.name} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                <span className="text-sm font-semibold">{t.name}</span>
              </div>
            ))}
          </div>
        )
      })()}

      {season.scheduleText ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {season.scheduleText}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]/50" />
          <p className="text-[var(--muted-foreground)]">Schedule will be announced soon. Stay tuned!</p>
        </div>
      )}
    </div>
  )
}
