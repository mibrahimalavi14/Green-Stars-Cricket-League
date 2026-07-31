"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Users } from "lucide-react"

export default function AdminSquadPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [selectedRole, setSelectedRole] = useState("playing")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/matches").then(r => r.json()),
      fetch("/api/players?all=true").then(r => r.json()).catch(() => fetch("/api/players").then(r => r.json())),
    ]).then(([m, p]) => {
      setMatches(Array.isArray(m) ? m : [])
      setPlayers(Array.isArray(p) ? p : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedMatch) {
      fetch(`/api/squad?matchId=${selectedMatch}`).then(r => r.json()).then(data => {
        setMembers(Array.isArray(data) ? data : [])
      })
    } else {
      setMembers([])
    }
  }, [selectedMatch])

  async function addMember() {
    if (!selectedMatch || !selectedPlayer) return
    const player = players.find(p => p.id === selectedPlayer)
    await fetch("/api/squad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatch, playerId: selectedPlayer, teamId: player?.teamId || "", role: selectedRole }),
    })
    setSelectedPlayer("")
    setSelectedRole("playing")
    const res = await fetch(`/api/squad?matchId=${selectedMatch}`)
    setMembers(await res.json())
  }

  async function updateRole(id: string, role: string) {
    const member = members.find(m => m.id === id)
    await fetch("/api/squad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatch, playerId: member?.playerId, teamId: member?.teamId || "", role }),
    })
    const res = await fetch(`/api/squad?matchId=${selectedMatch}`)
    setMembers(await res.json())
  }

  async function removeMember(id: string) {
    await fetch(`/api/squad?id=${id}`, { method: "DELETE" })
    setMembers(members.filter(m => m.id !== id))
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Squad Selection</h1>
      <p className="mb-8 text-[var(--muted-foreground)]">Set playing XI for each match</p>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">Select Match</label>
        <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm">
          <option value="">Choose a match...</option>
          {matches.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.matchNo ? `Match ${m.matchNo}: ` : ""}{m.team1?.shortName || "Team1"} vs {m.team2?.shortName || "Team2"} - {m.date ? new Date(m.date).toLocaleDateString("en-GB") : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm">
              <option value="">Add a player...</option>
              {players.filter((p: any) => !members.find(m => m.playerId === p.id)).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.team?.shortName || p.role})</option>
              ))}
            </select>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
              <option value="playing">Playing XI</option>
              <option value="substitute">Substitute</option>
              <option value="reserve">Reserve</option>
            </select>
            <button onClick={addMember} disabled={!selectedPlayer} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50">
              <Plus className="h-4 w-4" /> Add Player
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border)]">
            <div className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <h3 className="font-semibold">Squad ({members.length} players)</h3>
            </div>
            {members.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">No players added yet</div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.player?.photo && m.player.photo !== "/placeholder-player.svg" ? (
                        <img src={m.player.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)]"><Users className="h-4 w-4" /></div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{m.player?.name || "Unknown"}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{m.player?.role || ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${m.role === "playing" ? "bg-green-500/15 text-green-600" : m.role === "substitute" ? "bg-amber-500/15 text-amber-600" : "bg-gray-500/15 text-gray-500"}`}>
                        {m.role || "playing"}
                      </span>
                      <select value={m.role || "playing"} onChange={e => updateRole(m.id, e.target.value)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs">
                        <option value="playing">Playing XI</option>
                        <option value="substitute">Substitute</option>
                        <option value="reserve">Reserve</option>
                      </select>
                      <button onClick={() => removeMember(m.id)} className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
