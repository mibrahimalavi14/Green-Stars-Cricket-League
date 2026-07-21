"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Match {
  id: string; matchNo: number; stage: string; date: string; status: string; result: string; team1Score: string; team2Score: string
  tossWinner: string; tossDecision: string; manOfMatch: string; venue: string
  team1: { id: string; shortName: string; name: string; color: string; logo: string }
  team2: { id: string; shortName: string; name: string; color: string; logo: string }
  season: { name: string }
}

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    router.refresh()
  }

  async function deleteMatch(id: string) {
    setDeleting(id)
    await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const stageLabel: Record<string, string> = {
          league: "", qualifier1: "Qualifier 1", eliminator: "Eliminator", qualifier2: "Qualifier 2", final: "Final",
        }
        const isPlayoff = m.stage !== "league"
        return (
        <div key={m.id} className={`rounded-lg border p-3 sm:p-4 ${isPlayoff ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10' : 'border-[var(--border)] bg-[var(--card)]'}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">{isPlayoff ? `${stageLabel[m.stage] || m.stage}` : `${m.season.name} \u00b7 Match ${m.matchNo}`} &middot; {new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" })} &middot; {new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })}</p>
              {isPlayoff ? (
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{stageLabel[m.stage] || m.stage}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">&middot;</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">TBD</p>
                  <span className="text-xs text-amber-600 dark:text-amber-400">vs</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400">TBD</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {m.team1.logo && <img src={m.team1.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />}
                  <p className="font-medium text-sm">{m.team1.name}</p>
                  <span className="text-xs text-[var(--muted-foreground)]">vs</span>
                  <p className="font-medium text-sm">{m.team2.name}</p>
                  {m.team2.logo && <img src={m.team2.logo} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover" />}
                </div>
              )}
              {!isPlayoff && m.team1Score && <p className="text-sm">{m.team1Score} - {m.team2Score}</p>}
              {!isPlayoff && m.result && <p className="text-xs text-[var(--muted-foreground)]">{m.result}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
              <span className={`rounded px-2 py-1 text-xs font-medium ${
                m.status === "live" ? "bg-red-500/20 text-red-500" :
                m.status === "completed" ? "bg-green-500/20 text-green-500" :
                "bg-blue-500/20 text-blue-500"
              }`}>{m.status}</span>
              {m.status === "upcoming" && (
                <button onClick={() => updateStatus(m.id, "live")} className="rounded bg-red-500 px-2 py-1 text-xs text-white whitespace-nowrap">Set Live</button>
              )}
              {m.status === "live" && (
                <Link href={`/admin/live-scoring/${m.id}`} className="rounded bg-purple-600 px-2 py-1 text-xs text-white whitespace-nowrap hover:bg-purple-700">
                  Live Scoring
                </Link>
              )}
              {(m.status === "completed" || m.status === "live") && (
                <Link href="/admin/performances" className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white whitespace-nowrap hover:opacity-90">
                  Scorecard
                </Link>
              )}
              <button onClick={() => deleteMatch(m.id)} disabled={deleting === m.id}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50 whitespace-nowrap">Delete</button>
            </div>
          </div>
        </div>
      )})}
      {matches.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No matches yet.</p>}
    </div>
  )
}