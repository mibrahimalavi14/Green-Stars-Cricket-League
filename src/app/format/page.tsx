import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/lib/workspace"
import { Trophy, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function FormatPage() {
  const workspaceId = await getCurrentWorkspaceId()
  const season = await prisma.season.findFirst({ where: { isActive: true, workspaceId } })

  if (!season) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Tournament Format</h1>
        <p className="mt-4 text-[var(--muted-foreground)]">No active season. Format will appear here once available.</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-medium text-white hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    )
  }

  if (!season.formatText) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Tournament Format</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{season.name} ({season.year})</p>
        <p className="mt-4 text-[var(--muted-foreground)]">Format will be announced soon. Stay tuned!</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-medium text-white hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Tournament Format</h1>
        <p className="text-[var(--muted-foreground)]">{season.name} ({season.year})</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Rules & Format</h2>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
          {season.formatText}
        </div>
      </div>
    </div>
  )
}
