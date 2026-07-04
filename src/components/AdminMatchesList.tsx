"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Match {
  id: string; date: string; status: string; result: string; team1Score: string; team2Score: string
  team1: { id: string; shortName: string; name: string; color: string }
  team2: { id: string; shortName: string; name: string; color: string }
  season: { name: string }
}

interface Player {
  id: string; name: string; role: string; teamId: string
}

interface PlayerStats {
  runs: string; balls: string; fours: string; sixes: string; ones: string; twos: string; isOut: boolean
  wickets: string; bowlRuns: string; bowlBalls: string; catches: string
}

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const [scoring, setScoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [form, setForm] = useState({ team1Score: "", team2Score: "", result: "" })
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({})

  useEffect(() => {
    fetch("/api/players").then(r => r.json()).then(setAllPlayers)
  }, [])

  function openScoring(id: string) {
    setScoring(id)
    setForm({ team1Score: "", team2Score: "", result: "" })
    const initial: Record<string, PlayerStats> = {}
    for (const p of allPlayers) {
      initial[p.id] = { runs: "", balls: "", fours: "", sixes: "", ones: "", twos: "", isOut: false, wickets: "", bowlRuns: "", bowlBalls: "", catches: "" }
    }
    setPlayerStats(initial)
  }

  function updatePlayer(playerId: string, field: string, value: string | boolean) {
    setPlayerStats(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }))
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    router.refresh()
  }

  async function submitScore(id: string, m: Match) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form, status: "completed" }),
    })

    const playersData = allPlayers
      .filter(p => p.teamId === m.team1.id || p.teamId === m.team2.id)
      .filter(p => {
        const s = playerStats[p.id]
        return s && (s.runs || s.wickets || s.catches)
      })
      .map(p => ({
        playerId: p.id,
        teamId: p.teamId,
        battingRuns: parseInt(playerStats[p.id]?.runs) || 0,
        ballsFaced: parseInt(playerStats[p.id]?.balls) || 0,
        fours: parseInt(playerStats[p.id]?.fours) || 0,
        sixes: parseInt(playerStats[p.id]?.sixes) || 0,
        ones: parseInt(playerStats[p.id]?.ones) || 0,
        twos: parseInt(playerStats[p.id]?.twos) || 0,
        isOut: playerStats[p.id]?.isOut || false,
        bowlingWickets: parseInt(playerStats[p.id]?.wickets) || 0,
        bowlingRuns: parseInt(playerStats[p.id]?.bowlRuns) || 0,
        ballsBowled: parseInt(playerStats[p.id]?.bowlBalls) || 0,
        catches: parseInt(playerStats[p.id]?.catches) || 0,
      }))

    if (playersData.length > 0) {
      await fetch("/api/performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, players: playersData }),
      })
    }

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

  function PlayerRow(p: Player, color: string) {
    const s = playerStats[p.id] || { runs: "", balls: "", fours: "", sixes: "", ones: "", twos: "", isOut: false, wickets: "", bowlRuns: "", bowlBalls: "", catches: "" }
    return (
      <div key={p.id} className="rounded border border-[var(--border)] bg-[var(--background)] p-2 text-xs" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
        <p className="mb-1 font-medium">{p.name} <span className="text-[var(--muted-foreground)]">({p.role})</span></p>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">Runs</label>
            <input type="number" min="0" value={s.runs} onChange={e => updatePlayer(p.id, "runs", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">BF</label>
            <input type="number" min="0" value={s.balls} onChange={e => updatePlayer(p.id, "balls", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">4s</label>
            <input type="number" min="0" value={s.fours} onChange={e => updatePlayer(p.id, "fours", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">6s</label>
            <input type="number" min="0" value={s.sixes} onChange={e => updatePlayer(p.id, "sixes", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">1s</label>
            <input type="number" min="0" value={s.ones} onChange={e => updatePlayer(p.id, "ones", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">2s</label>
            <input type="number" min="0" value={s.twos} onChange={e => updatePlayer(p.id, "twos", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div className="flex items-center gap-1"><input type="checkbox" checked={s.isOut} onChange={e => updatePlayer(p.id, "isOut", e.target.checked)} className="h-3 w-3" />
            <label className="text-[10px] text-[var(--muted-foreground)]">Out</label></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">Wkts</label>
            <input type="number" min="0" value={s.wickets} onChange={e => updatePlayer(p.id, "wickets", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">BowlR</label>
            <input type="number" min="0" value={s.bowlRuns} onChange={e => updatePlayer(p.id, "bowlRuns", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">Balls</label>
            <input type="number" min="0" value={s.bowlBalls} onChange={e => updatePlayer(p.id, "bowlBalls", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
          <div><label className="block text-[10px] text-[var(--muted-foreground)]">Ct</label>
            <input type="number" min="0" value={s.catches} onChange={e => updatePlayer(p.id, "catches", e.target.value)} className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const team1Players = allPlayers.filter(p => p.teamId === m.team1.id)
        const team2Players = allPlayers.filter(p => p.teamId === m.team2.id)
        return (
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
              {(m.status === "live" || m.status === "upcoming") && !scoring && (
                <button onClick={() => openScoring(m.id)} className="rounded bg-green-500 px-2 py-1 text-xs text-white">{m.status === "live" ? "Add Score" : "Set Result"}</button>
              )}
              <button onClick={() => deleteMatch(m.id)} disabled={deleting === m.id}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50">Delete</button>
            </div>
          </div>

          {scoring === m.id && (
            <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
              <div className="grid gap-3 md:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs">{m.team1.shortName} Score</label>
                  <input value={form.team1Score} onChange={e => setForm({...form, team1Score: e.target.value})}
                    placeholder="180/4"
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">{m.team2.shortName} Score</label>
                  <input value={form.team2Score} onChange={e => setForm({...form, team2Score: e.target.value})}
                    placeholder="170/8"
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs">Result</label>
                  <input value={form.result} onChange={e => setForm({...form, result: e.target.value})}
                    placeholder={`${m.team1.shortName} won by...`}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
              </div>

              {team1Players.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold" style={{ color: m.team1.color }}>{m.team1.shortName} Players</p>
                  <div className="grid gap-2 md:grid-cols-2">{team1Players.map(p => PlayerRow(p, m.team1.color))}</div>
                </div>
              )}
              {team2Players.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold" style={{ color: m.team2.color }}>{m.team2.shortName} Players</p>
                  <div className="grid gap-2 md:grid-cols-2">{team2Players.map(p => PlayerRow(p, m.team2.color))}</div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => submitScore(m.id, m)} className="rounded bg-green-600 px-4 py-1.5 text-sm text-white">Save Result & Performances</button>
                <button onClick={() => setScoring(null)} className="rounded bg-gray-500 px-4 py-1.5 text-sm text-white">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )})}
      {matches.length === 0 && <p className="text-center text-[var(--muted-foreground)] py-8">No matches yet.</p>}
    </div>
  )
}
