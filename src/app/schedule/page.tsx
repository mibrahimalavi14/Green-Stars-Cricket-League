import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { formatDateTimeInZone } from "@/lib/utils"
import { Calendar, Trophy, Clock, ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  live: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
}

export default async function SchedulePage() {
  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId } })

  if (!season) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Match Schedule</h1>
        <p className="mt-4 text-[var(--muted-foreground)]">No active season. Schedule will appear here once available.</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-medium text-white hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    )
  }

  const fixtures = await prisma.seasonFixture.findMany({
    where: { seasonId: season.id },
    orderBy: { matchNumber: "asc" },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Match Schedule</h1>
        <p className="text-[var(--muted-foreground)]">{season.name} ({season.year})</p>
      </div>

      {season.scheduleImage && (
        <div className="mb-8 overflow-hidden rounded-xl border border-[var(--border)]">
          <img
            src={season.scheduleImage}
            alt={`${season.name} schedule`}
            className="w-full object-contain"
            loading="lazy"
          />
        </div>
      )}

      {season.formatText && (
        <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-[var(--accent)]" />
            Tournament Format
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {season.formatText}
          </div>
        </div>
      )}

      {fixtures.length > 0 ? (
        <div className="space-y-3">
          {fixtures.map(f => (
            <div
              key={f.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--muted)]/30"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
                  {f.matchNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{f.team1Name} <span className="text-[var(--muted-foreground)] font-normal">vs</span> {f.team2Name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    {f.dateTime && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTimeInZone(f.dateTime, f.status === "completed" ? "Asia/Karachi" : "Asia/Karachi")}
                      </span>
                    )}
                    {f.venue && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {f.venue}
                      </span>
                    )}
                  </div>
                </div>
                {f.result && (
                  <span className="text-xs font-medium text-[var(--accent)]">{f.result}</span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[f.status] || STATUS_STYLE.upcoming}`}>
                  {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
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
