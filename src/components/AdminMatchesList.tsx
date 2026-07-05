"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Match {
  id: string; date: string; status: string; result: string; team1Score: string; team2Score: string
  tossWinner: string; tossDecision: string; manOfMatch: string; venue: string
  team1: { id: string; shortName: string; name: string; color: string }
  team2: { id: string; shortName: string; name: string; color: string }
  season: { name: string }
  innings: { teamId: string; runs: number; wickets: number; balls: number; extras: number }[]
}

interface Player {
  id: string; name: string; role: string; teamId: string
}

export function AdminMatchesList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const [scoring, setScoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [form, setForm] = useState({
    team1Score: "", team2Score: "", result: "",
    tossWinner: "", tossDecision: "", manOfMatch: "", venue: "",
    inn1Runs: "", inn1Wkts: "", inn1Balls: "", inn1Extras: "",
    inn2Runs: "", inn2Wkts: "", inn2Balls: "", inn2Extras: "",
  })
  const [stats, setStats] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    fetch("/api/players").then(r => r.json()).then(setAllPlayers)
  }, [])

  function openScoring(id: string, m: Match) {
    const inn1 = m.innings?.find(i => i.teamId === m.team1.id)
    const inn2 = m.innings?.find(i => i.teamId === m.team2.id)
    setScoring(id)
    setForm({
      team1Score: m.team1Score || "", team2Score: m.team2Score || "", result: m.result || "",
      tossWinner: m.tossWinner || "", tossDecision: m.tossDecision || "",
      manOfMatch: m.manOfMatch || "", venue: m.venue || "",
      inn1Runs: inn1?.runs?.toString() || "", inn1Wkts: inn1?.wickets?.toString() || "",
      inn1Balls: inn1?.balls?.toString() || "", inn1Extras: inn1?.extras?.toString() || "",
      inn2Runs: inn2?.runs?.toString() || "", inn2Wkts: inn2?.wickets?.toString() || "",
      inn2Balls: inn2?.balls?.toString() || "", inn2Extras: inn2?.extras?.toString() || "",
    })
    setStats({})
  }

  function s(playerId: string, field: string) {
    return stats[playerId]?.[field] ?? ""
  }

  function set(playerId: string, field: string, value: string) {
    setStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), [field]: value },
    }))
  }

  function toggleOut(playerId: string) {
    setStats(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] || {}), out: prev[playerId]?.out === "1" ? "" : "1" },
    }))
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
      body: JSON.stringify({
        id, status: "completed",
        team1Score: form.team1Score, team2Score: form.team2Score, result: form.result,
        tossWinner: form.tossWinner, tossDecision: form.tossDecision,
        manOfMatch: form.manOfMatch, venue: form.venue,
      }),
    })

    const playersData = allPlayers
      .filter(p => p.teamId === m.team1.id || p.teamId === m.team2.id)
      .filter(p => s(p.id, "runs") || s(p.id, "wkts") || s(p.id, "ct") || s(p.id, "st") || s(p.id, "ro"))
      .map(p => ({
        playerId: p.id,
        teamId: p.teamId,
        battingRuns: parseInt(s(p.id, "runs")) || 0,
        ballsFaced: parseInt(s(p.id, "bf")) || 0,
        fours: parseInt(s(p.id, "4s")) || 0,
        sixes: parseInt(s(p.id, "6s")) || 0,
        ones: parseInt(s(p.id, "1s")) || 0,
        twos: parseInt(s(p.id, "2s")) || 0,
        isOut: s(p.id, "out") === "1",
        dismissalType: s(p.id, "dismissal") || "",
        bowlingWickets: parseInt(s(p.id, "wkts")) || 0,
        bowlingRuns: parseInt(s(p.id, "br")) || 0,
        ballsBowled: parseInt(s(p.id, "bb")) || 0,
        maidens: parseInt(s(p.id, "mdns")) || 0,
        catches: parseInt(s(p.id, "ct")) || 0,
        stumpings: parseInt(s(p.id, "st")) || 0,
        runOuts: parseInt(s(p.id, "ro")) || 0,
      }))

    if (playersData.length > 0) {
      await fetch("/api/performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, players: playersData }),
      })
    }

    if (form.inn1Runs || form.inn2Runs) {
      await fetch("/api/innings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: id,
          innings: [
            { teamId: m.team1.id, runs: parseInt(form.inn1Runs) || 0, wickets: parseInt(form.inn1Wkts) || 0, balls: parseInt(form.inn1Balls) || 0, extras: parseInt(form.inn1Extras) || 0 },
            { teamId: m.team2.id, runs: parseInt(form.inn2Runs) || 0, wickets: parseInt(form.inn2Wkts) || 0, balls: parseInt(form.inn2Balls) || 0, extras: parseInt(form.inn2Extras) || 0 },
          ],
        }),
      })
    }

    setScoring(null)
    setForm({
      team1Score: "", team2Score: "", result: "",
      tossWinner: "", tossDecision: "", manOfMatch: "", venue: "",
      inn1Runs: "", inn1Wkts: "", inn1Balls: "", inn1Extras: "",
      inn2Runs: "", inn2Wkts: "", inn2Balls: "", inn2Extras: "",
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

  function PlayerTable(players: Player[], color: string, teamName: string) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
              <th className="py-1 pr-2 text-left font-medium">Player</th>
              <th className="py-1 px-1 text-center font-medium">Runs</th>
              <th className="py-1 px-1 text-center font-medium">Balls</th>
              <th className="py-1 px-1 text-center font-medium">4s</th>
              <th className="py-1 px-1 text-center font-medium">6s</th>
              <th className="py-1 px-1 text-center font-medium">1s</th>
              <th className="py-1 px-1 text-center font-medium">2s</th>
              <th className="py-1 px-1 text-center font-medium">Out</th>
              <th className="py-1 px-1 text-center font-medium">Dismissal</th>
              <th className="py-1 px-1 text-center font-medium">Wkts</th>
              <th className="py-1 px-1 text-center font-medium">Runs</th>
              <th className="py-1 px-1 text-center font-medium">Balls</th>
              <th className="py-1 px-1 text-center font-medium">Mdns</th>
              <th className="py-1 px-1 text-center font-medium">Ct</th>
              <th className="py-1 px-1 text-center font-medium">St</th>
              <th className="py-1 px-1 text-center font-medium">RO</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--background)]">
                <td className="py-1 pr-2 text-left font-medium" style={{ color }}>{p.name}</td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "runs")} onChange={e => set(p.id, "runs", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "bf")} onChange={e => set(p.id, "bf", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "4s")} onChange={e => set(p.id, "4s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "6s")} onChange={e => set(p.id, "6s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "1s")} onChange={e => set(p.id, "1s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "2s")} onChange={e => set(p.id, "2s", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1 text-center"><input type="checkbox" checked={s(p.id, "out") === "1"} onChange={() => toggleOut(p.id)} className="h-3 w-3" /></td>
                <td className="py-1 px-1">
                  <select value={s(p.id, "dismissal")} onChange={e => set(p.id, "dismissal", e.target.value)} className="w-14 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center text-[10px]">
                    <option value="">-</option>
                    <option value="bowled">b</option>
                    <option value="caught">c</option>
                    <option value="lbw">lbw</option>
                    <option value="stumped">st</option>
                    <option value="run out">ro</option>
                    <option value="retired">rt</option>
                    <option value="hit wicket">hw</option>
                  </select>
                </td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "wkts")} onChange={e => set(p.id, "wkts", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "br")} onChange={e => set(p.id, "br", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "bb")} onChange={e => set(p.id, "bb", e.target.value)} className="w-10 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "mdns")} onChange={e => set(p.id, "mdns", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "ct")} onChange={e => set(p.id, "ct", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "st")} onChange={e => set(p.id, "st", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
                <td className="py-1 px-1"><input type="number" min="0" value={s(p.id, "ro")} onChange={e => set(p.id, "ro", e.target.value)} className="w-8 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-center" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const team1Players = allPlayers.filter(p => p.teamId === m.team1.id)
        const team2Players = allPlayers.filter(p => p.teamId === m.team2.id)
        const allMatchPlayers = [...team1Players, ...team2Players]
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
              {!scoring && (
                <button onClick={() => openScoring(m.id, m)} className="rounded bg-green-500 px-2 py-1 text-xs text-white">
                  {m.status === "completed" ? (m.team1Score ? "Edit Result" : "Add Result") : m.status === "live" ? "Add Score" : "Set Result"}
                </button>
              )}
              <button onClick={() => deleteMatch(m.id)} disabled={deleting === m.id}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50">Delete</button>
            </div>
          </div>

          {scoring === m.id && (
            <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs">Toss Winner</label>
                  <select value={form.tossWinner} onChange={e => setForm({...form, tossWinner: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm">
                    <option value="">Select</option>
                    <option value={m.team1.id}>{m.team1.shortName}</option>
                    <option value={m.team2.id}>{m.team2.shortName}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Toss Decision</label>
                  <select value={form.tossDecision} onChange={e => setForm({...form, tossDecision: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm">
                    <option value="">Select</option>
                    <option value="bat">Bat</option>
                    <option value="bowl">Bowl</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Man of the Match</label>
                  <select value={form.manOfMatch} onChange={e => setForm({...form, manOfMatch: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm">
                    <option value="">Select</option>
                    {allMatchPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Venue</label>
                  <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})}
                    placeholder="Main Stadium"
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
              </div>

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

              <div className="grid gap-3 md:grid-cols-4">
                <p className="text-sm font-semibold md:col-span-4">Innings Details</p>
                <div>
                  <label className="mb-1 block text-xs">{m.team1.shortName} Runs</label>
                  <input type="number" min="0" value={form.inn1Runs} onChange={e => setForm({...form, inn1Runs: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Wickets</label>
                  <input type="number" min="0" max="10" value={form.inn1Wkts} onChange={e => setForm({...form, inn1Wkts: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Balls (20 ov = 120)</label>
                  <input type="number" min="0" value={form.inn1Balls} onChange={e => setForm({...form, inn1Balls: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" placeholder="120" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Extras</label>
                  <input type="number" min="0" value={form.inn1Extras} onChange={e => setForm({...form, inn1Extras: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">{m.team2.shortName} Runs</label>
                  <input type="number" min="0" value={form.inn2Runs} onChange={e => setForm({...form, inn2Runs: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Wickets</label>
                  <input type="number" min="0" max="10" value={form.inn2Wkts} onChange={e => setForm({...form, inn2Wkts: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Balls (20 ov = 120)</label>
                  <input type="number" min="0" value={form.inn2Balls} onChange={e => setForm({...form, inn2Balls: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" placeholder="120" />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Extras</label>
                  <input type="number" min="0" value={form.inn2Extras} onChange={e => setForm({...form, inn2Extras: e.target.value})}
                    className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm" />
                </div>
              </div>

              {team1Players.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold" style={{ color: m.team1.color }}>{m.team1.shortName} — Batting & Bowling</p>
                  {PlayerTable(team1Players, m.team1.color, m.team1.shortName)}
                </div>
              )}
              {team2Players.length > 0 && (
                <div>
                  <p className="mb-1 mt-3 text-sm font-semibold" style={{ color: m.team2.color }}>{m.team2.shortName} — Batting & Bowling</p>
                  {PlayerTable(team2Players, m.team2.color, m.team2.shortName)}
                </div>
              )}

              <div className="flex gap-2 pt-2">
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