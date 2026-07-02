"use client"

import { useRouter } from "next/navigation"

interface Match {
  id: string; date: string; status: string; result: string; team1Score: string; team2Score: string
  team1: { shortName: string; name: string }; team2: { shortName: string; name: string }
  season: { name: string }
}

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()

  async function updateStatus(id: string, status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">{m.season.name} &middot; {new Date(m.date).toLocaleDateString()}</p>
              <p className="font-medium">{m.team1.shortName} vs {m.team2.shortName}</p>
              {m.team1Score && <p className="text-sm">{m.team1Score} - {m.team2Score}</p>}
              {m.result && <p className="text-xs text-[var(--muted-foreground)]">{m.result}</p>}
            </div>
            <div className="flex gap-2">
              <span className={`rounded px-2 py-1 text-xs font-medium ${
                m.status === "live" ? "bg-red-500/20 text-red-500" :
                m.status === "completed" ? "bg-green-500/20 text-green-500" :
                "bg-blue-500/20 text-blue-500"
              }`}>{m.status}</span>
              {m.status === "upcoming" && (
                <button onClick={() => updateStatus(m.id, "live")} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Set Live</button>
              )}
              {m.status === "live" && (
                <button onClick={() => updateStatus(m.id, "completed")} className="rounded bg-green-500 px-2 py-1 text-xs text-white">Complete</button>
              )}
            </div>
          </div>
        </div>
      ))}
      {matches.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No matches yet.</p>}
    </div>
  )
}
