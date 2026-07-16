"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Player {
  id: string
  name: string
  role: string
  teamId: string
  team?: { id: string; shortName: string }
}

interface SavedPerf {
  playerId: string
  teamId: string
  battingRuns: number
  ballsFaced: number
  fours: number
  sixes: number
  ones: number
  twos: number
  isOut: boolean
  dismissalType: string
  dismissedByBowlerId: string
  dismissedByFielderId: string
  bowlingWickets: number
  bowlingRuns: number
  ballsBowled: number
  maidens: number
  wides: number
  noBalls: number
  catches: number
  stumpings: number
  runOuts: number
}

interface PlayerForm {
  playerId: string
  teamId: string
  battingRuns: string
  ballsFaced: string
  fours: string
  sixes: string
  ones: string
  twos: string
  isOut: boolean
  dismissalType: string
  dismissedByBowlerId: string
  dismissedByFielderId: string
  bowlingWickets: string
  bowlingRuns: string
  ballsBowled: string
  maidens: string
  wides: string
  noBalls: string
  catches: string
  stumpings: string
  runOuts: string
}

export function AdminPerformanceForm({ match }: {
  match: {
    id: string
    seasonName: string
    date: string
    team1Id: string
    team1Name: string
    team1Color: string
    team2Id: string
    team2Name: string
    team2Color: string
    team1Score: string
    team2Score: string
    savedPerformances: SavedPerf[]
  }
}) {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [formData, setFormData] = useState<Record<string, PlayerForm>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/players").then(r => r.json()).then((allPlayers: Player[]) => {
      setPlayers(allPlayers)

      const initial: Record<string, PlayerForm> = {}

      for (const p of allPlayers) {
        const saved = match.savedPerformances.find(sp => sp.playerId === p.id)
        initial[p.id] = {
          playerId: p.id,
          teamId: saved?.teamId || p.teamId,
          battingRuns: String(saved?.battingRuns ?? ""),
          ballsFaced: String(saved?.ballsFaced ?? ""),
          fours: String(saved?.fours ?? ""),
          sixes: String(saved?.sixes ?? ""),
          ones: String(saved?.ones ?? ""),
          twos: String(saved?.twos ?? ""),
          isOut: saved?.isOut ?? false,
          dismissalType: saved?.dismissalType || "",
          dismissedByBowlerId: saved?.dismissedByBowlerId || "",
          dismissedByFielderId: saved?.dismissedByFielderId || "",
          bowlingWickets: String(saved?.bowlingWickets ?? ""),
          bowlingRuns: String(saved?.bowlingRuns ?? ""),
          ballsBowled: String(saved?.ballsBowled ?? ""),
          maidens: String(saved?.maidens ?? ""),
          wides: String(saved?.wides ?? ""),
          noBalls: String(saved?.noBalls ?? ""),
          catches: String(saved?.catches ?? ""),
          stumpings: String(saved?.stumpings ?? ""),
          runOuts: String(saved?.runOuts ?? ""),
        }
      }
      setFormData(initial)
    })
  }, [match.id, match.savedPerformances])

  async function handleSave() {
    setSaving(true)
    const playersData = Object.values(formData)
      .filter(p => p.battingRuns || p.bowlingWickets || p.catches)
      .map(p => {
        const player = players.find(pl => pl.id === p.playerId)
        return {
          playerId: p.playerId,
          teamId: player?.teamId || p.teamId,
          battingRuns: parseInt(p.battingRuns) || 0,
          ballsFaced: parseInt(p.ballsFaced) || 0,
          fours: parseInt(p.fours) || 0,
          sixes: parseInt(p.sixes) || 0,
          ones: parseInt(p.ones) || 0,
          twos: parseInt(p.twos) || 0,
          isOut: p.isOut,
          dismissalType: p.dismissalType || "",
          dismissedByBowlerId: p.dismissedByBowlerId || "",
          dismissedByFielderId: p.dismissedByFielderId || "",
          bowlingWickets: parseInt(p.bowlingWickets) || 0,
          bowlingRuns: parseInt(p.bowlingRuns) || 0,
          ballsBowled: parseInt(p.ballsBowled) || 0,
          maidens: parseInt(p.maidens) || 0,
          wides: parseInt(p.wides) || 0,
          noBalls: parseInt(p.noBalls) || 0,
          catches: parseInt(p.catches) || 0,
          stumpings: parseInt(p.stumpings) || 0,
          runOuts: parseInt(p.runOuts) || 0,
        }
      })

    await fetch("/api/performances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, players: playersData }),
    })
    setSaving(false)
    router.refresh()
  }

  function updateField(playerId: string, field: string, value: string | boolean) {
    setFormData(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }))
  }

  const team1Players = players.filter(p => p.teamId === match.team1Id)
  const team2Players = players.filter(p => p.teamId === match.team2Id)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{match.seasonName} &middot; {new Date(match.date).toLocaleDateString()}</p>
          <p className="font-semibold">
            <span style={{ color: match.team1Color }}>{match.team1Name}</span>
            {match.team1Score && ` (${match.team1Score})`} vs{' '}
            <span style={{ color: match.team2Color }}>{match.team2Name}</span>
            {match.team2Score && ` (${match.team2Score})`}
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-medium" style={{ color: match.team1Color }}>{match.team1Name}</h4>
          {team1Players.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No players in this team.</p>}
          {team1Players.map(p => renderPlayerForm(p, formData[p.id], (f, v) => updateField(p.id, f, v)))}
        </div>
        <div>
          <h4 className="mb-2 font-medium" style={{ color: match.team2Color }}>{match.team2Name}</h4>
          {team2Players.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No players in this team.</p>}
          {team2Players.map(p => renderPlayerForm(p, formData[p.id], (f, v) => updateField(p.id, f, v)))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Performances"}
      </button>
    </div>
  )
}

function renderPlayerForm(
  player: Player,
  data: PlayerForm | undefined,
  update: (field: string, value: string | boolean) => void
) {
  if (!data) return null

  const isOut = data.isOut
  const dismissType = data.dismissalType

  return (
    <div key={player.id} className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="mb-2 text-sm font-medium">{player.name} <span className="text-[var(--muted-foreground)]">({player.role})</span></p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-[var(--muted-foreground)]">Runs</label>
          <input type="number" min="0" value={data.battingRuns} onChange={e => update("battingRuns", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Balls Faced">BF</label>
          <input type="number" min="0" value={data.ballsFaced} onChange={e => update("ballsFaced", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Fours">4s</label>
          <input type="number" min="0" value={data.fours} onChange={e => update("fours", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Sixes">6s</label>
          <input type="number" min="0" value={data.sixes} onChange={e => update("sixes", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Ones (1 run)">1s</label>
          <input type="number" min="0" value={data.ones} onChange={e => update("ones", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Twos (2 runs)">2s</label>
          <input type="number" min="0" value={data.twos} onChange={e => update("twos", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div className="flex items-center gap-1">
          <input type="checkbox" checked={isOut} onChange={e => update("isOut", e.target.checked)}
            className="h-3 w-3" />
          <label className="text-[var(--muted-foreground)]">Out</label>
        </div>
        <div className="col-span-2">
          {isOut && (
            <select value={dismissType} onChange={e => update("dismissalType", e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs">
              <option value="">Dismissal type</option>
              <option value="bowled">Bowled</option>
              <option value="caught">Caught</option>
              <option value="lbw">LBW</option>
              <option value="stumped">Stumped</option>
              <option value="run out">Run Out</option>
              <option value="retired">Retired Hurt</option>
              <option value="hit wicket">Hit Wicket</option>
            </select>
          )}
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Wickets">Wkts</label>
          <input type="number" min="0" value={data.bowlingWickets} onChange={e => update("bowlingWickets", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]">Bowl Runs</label>
          <input type="number" min="0" value={data.bowlingRuns} onChange={e => update("bowlingRuns", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]">Balls</label>
          <input type="number" min="0" value={data.ballsBowled} onChange={e => update("ballsBowled", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Maidens">Mdns</label>
          <input type="number" min="0" value={data.maidens} onChange={e => update("maidens", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Wides">Wd</label>
          <input type="number" min="0" value={data.wides} onChange={e => update("wides", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="No Balls">Nb</label>
          <input type="number" min="0" value={data.noBalls} onChange={e => update("noBalls", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]" title="Catches">Ct</label>
          <input type="number" min="0" value={data.catches} onChange={e => update("catches", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]">St</label>
          <input type="number" min="0" value={data.stumpings} onChange={e => update("stumpings", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="block text-[var(--muted-foreground)]">RO</label>
          <input type="number" min="0" value={data.runOuts} onChange={e => update("runOuts", e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs" />
        </div>
      </div>
    </div>
  )
}

