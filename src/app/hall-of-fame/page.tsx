"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Loader2, Users, Calendar, Award } from "lucide-react"

export default function HallOfFamePage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/hall-of-fame").then(r => r.json()).then(data => {
      setSeasons(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>
  }

  const champions = seasons.filter(s => s.winner)
  const past = seasons.filter(s => !s.isActive)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-yellow-500" />
        <h1 className="text-4xl font-bold">Hall of Fame</h1>
        <p className="text-[var(--muted-foreground)]">Green Stars Cricket League champions through the years</p>
      </div>

      {seasons.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">No seasons found</div>
      ) : (
        <div className="space-y-6">
          {seasons.map((s, i) => (
            <div key={s.id} className={`rounded-xl border p-6 transition-all ${
              s.isActive ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10" : "border-[var(--border)] bg-[var(--card)]"
            }`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--muted)] text-2xl font-bold">
                    {s.isActive ? <Award className="h-7 w-7 text-yellow-500" /> : <Medal className={`h-7 w-7 ${i === 0 ? "text-yellow-500" : "text-[var(--muted-foreground)]"}`} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{s.name} <span className="text-[var(--muted-foreground)]">({s.year})</span></h3>
                    {s.isActive && <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Current Season</span>}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {s.matchCount} matches</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {s.teamCount} teams</span>
                    </div>
                  </div>
                </div>
                {s.winner ? (
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted-foreground)]">Champion</p>
                    <div className="flex items-center gap-2">
                      {s.winner.logo && <img src={s.winner.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
                      <span className="text-lg font-bold" style={{ color: s.winner.color || "var(--accent)" }}>{s.winner.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-right text-sm text-[var(--muted-foreground)]">
                    {s.isActive ? "In Progress" : "No data"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
