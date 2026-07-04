"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Match {
  id: string; date: string; status: string; result: string; team1Score: string; team2Score: string
  team1: { shortName: string; name: string }; team2: { shortName: string; name: string }
  season: { name: string }
}

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const [scoring, setScoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ team1Score: "", team2Score: "", result: "" })

  async function updateStatus(id: string, status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    router.refresh()
  }

  async function submitScore(id: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form, status: "completed" }),
    })
    setScoring(null)
    setForm({ team1Score: "", team2Score: "", result: "" })
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
      {matches.map((m) => (
        <div key={m.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-[var(--muted-foreground)]">{m.season.name} &middot; {new Date(m.date).toLocaleDateString()}</p>
              <p className="font-medium">{m.team1.shortName} vs {m.team2.shortName}</p>
              {m.team1Score && <p className="text-sm">{m.team1Score} - {m.team2Score}</p>}
              {m.result && <p className="text-xs text-[var(--muted-foreground)]">{m.result}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-1 text-xs font-medium ${
                m.status === "live" ? "bg-red-500/20 text-red-500" :
                m.status === "completed" ? "bg-green-500/20 text-green-500" :
                "bg-blue-500/20 text-blue-500"
              }`}>{m.status}</span>
              {m.status === "upcoming" && (
                <button onClick={() => updateStatus(m.id, "live")} className="rounded bg-red-500 px-2 py-1 text-xs text-white">Set Live</button>
              )}
              {m.status === "live" && !scoring && (
                <button onClick={() => setScoring(m.id)} className="rounded bg-green-500 px-2 py-1 text-xs text-white">Add Score</button>
              )}
              {m.status === "upcoming" && (
                <button onClick={() => { setScoring(m.id); setForm({ team1Score: "", team2Score: "", result: "" }) }} className="rounded bg-orange-500 px-2 py-1 text-xs text-white">Set Result</button>
              )}
              <button onClick={() => deleteMatch(m.id)} disabled={deleting === m.id}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50">Delete</button>
            </div>
          </div>

          {scoring === m.id && (
            <div className="mt-3 grid gap-3 border-t border-[var(--border)] pt-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs">Team 1 Score (e.g. 180/4)</label>
                <input value={form.team1Score} onChange={e => setForm({...form, team1Score: e.target.value})}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs">Team 2 Score (e.g. 170/8)</label>
                <input value={form.team2Score} onChange={e => setForm({...form, team2Score: e.target.value})}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs">Result (e.g. "TeamName won by 10 runs")</label>
                <input value={form.result} onChange={e => setForm({...form, result: e.target.value})}
                  placeholder={`${m.team1.shortName} won by...`}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
              </div>
              <div className="flex gap-2 md:col-span-4">
                <button onClick={() => submitScore(m.id)} className="rounded bg-green-600 px-4 py-1.5 text-sm text-white">Save Result</button>
                <button onClick={() => setScoring(null)} className="rounded bg-gray-500 px-4 py-1.5 text-sm text-white">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {matches.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No matches yet.</p>}
    </div>
  )
}
