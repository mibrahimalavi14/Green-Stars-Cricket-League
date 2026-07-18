"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"

type Player = { id: string; name: string; role: string; battingStyle: string; bowlingStyle: string; photo: string; team: { name: string; shortName: string; color: string } } & Stats
type Stats = {
  runs: number; ballsFaced: number; fours: number; sixes: number; ones: number; twos: number
  fifties: number; hundreds: number; wickets: number; ballsBowled: number; runsConceded: number
  matchesPlayed: number; bestBowlingWickets: number; bestBowlingRuns: number
  catches: number; stumpings: number; runOuts: number; notOuts: number; ducks: number
}

const stats: { key: keyof Stats; label: string }[] = [
  { key: "matchesPlayed", label: "Matches" },
  { key: "runs", label: "Runs" },
  { key: "ballsFaced", label: "Balls Faced" },
  { key: "fours", label: "Fours" },
  { key: "sixes", label: "Sixes" },
  { key: "fifties", label: "Fifties" },
  { key: "hundreds", label: "Hundreds" },
  { key: "notOuts", label: "Not Outs" },
  { key: "wickets", label: "Wickets" },
  { key: "ballsBowled", label: "Balls Bowled" },
  { key: "runsConceded", label: "Runs Conceded" },
  { key: "catches", label: "Catches" },
  { key: "stumpings", label: "Stumpings" },
  { key: "runOuts", label: "Run Outs" },
  { key: "ducks", label: "Ducks" },
]

function StatRow({ label, a, b }: { label: string; a: number; b: number }) {
  const better = a > b ? "left" : b > a ? "right" : "tie"
  return (
    <tr className="border-b border-[var(--border)]">
      <td className={`p-3 text-center font-semibold ${better === "left" ? "text-green-600 dark:text-green-400" : ""}`}>{a}</td>
      <td className="p-3 text-center text-xs text-[var(--muted-foreground)]">{label}</td>
      <td className={`p-3 text-center font-semibold ${better === "right" ? "text-green-600 dark:text-green-400" : ""}`}>{b}</td>
    </tr>
  )
}

function PlayerCard({ player, onRemove }: { player: Player; onRemove: () => void }) {
  return (
    <div className="relative rounded-xl border-2 border-[var(--accent)]/30 bg-[var(--card)] p-4 text-center">
      <button onClick={onRemove} className="absolute right-2 top-2 rounded-full bg-red-500/20 p-1 text-red-500 transition-colors hover:bg-red-500/30"><X className="h-3 w-3" /></button>
      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: player.team.color }}>
        <span className="text-2xl font-bold text-white">{player.name.charAt(0)}</span>
      </div>
      <h3 className="font-bold">{player.name}</h3>
      <p className="text-xs text-[var(--muted-foreground)]">{player.team.shortName || player.team.name}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{player.role} • {player.battingStyle === "Left-handed" ? "LHB" : "RHB"}</p>
    </div>
  )
}

function PlayerSearch({ onSelect }: { onSelect: (p: Player) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Player[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    fetch(`/api/players`).then(r => r.json()).then((all: Player[]) => {
      setResults(all.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8))
    })
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)} placeholder="Search player..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-xl">
          {results.map(p => (
            <button key={p.id} onClick={() => { onSelect(p); setQuery(""); setResults([]); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--muted)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: p.team.color }}>{p.name.charAt(0)}</div>
              <div><p className="font-medium">{p.name}</p><p className="text-[10px] text-[var(--muted-foreground)]">{p.team.shortName || p.team.name} • {p.role}</p></div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  const [player1, setPlayer1] = useState<Player | null>(null)
  const [player2, setPlayer2] = useState<Player | null>(null)

  const battingSR = (r: number, b: number) => b > 0 ? ((r / b) * 100).toFixed(1) : "-"
  const bowlingEcon = (r: number, b: number) => b > 0 ? (r / (b / 6)).toFixed(2) : "-"
  const avg = (r: number, m: number) => m > 0 ? (r / m).toFixed(1) : "-"

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Player Comparison</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">Compare two players side by side across all stats</p>

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Player 1</label>
          <PlayerSearch onSelect={setPlayer1} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Player 2</label>
          <PlayerSearch onSelect={setPlayer2} />
        </div>
      </div>

      {player1 && player2 ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--muted)]">
            <div className="p-4"><PlayerCard player={player1} onRemove={() => setPlayer1(null)} /></div>
            <div className="flex items-center justify-center p-4"><span className="text-2xl font-bold text-[var(--muted-foreground)]">VS</span></div>
            <div className="p-4"><PlayerCard player={player2} onRemove={() => setPlayer2(null)} /></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="p-3 text-center text-[var(--muted-foreground)]">Player 1</th>
                  <th className="p-3 text-center text-xs text-[var(--muted-foreground)]">Stat</th>
                  <th className="p-3 text-center text-[var(--muted-foreground)]">Player 2</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => (
                  <StatRow key={s.key} label={s.label} a={player1[s.key]} b={player2[s.key]} />
                ))}
                <StatRow label="Batting SR" a={Number(battingSR(player1.runs, player1.ballsFaced))} b={Number(battingSR(player2.runs, player2.ballsFaced))} />
                <StatRow label="Bowling Econ" a={Number(bowlingEcon(player1.runsConceded, player1.ballsBowled))} b={Number(bowlingEcon(player2.runsConceded, player2.ballsBowled))} />
                <StatRow label="Avg (Runs/Match)" a={Number(avg(player1.runs, player1.matchesPlayed))} b={Number(avg(player2.runs, player2.matchesPlayed))} />
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-24 text-center">
          <p className="text-lg text-[var(--muted-foreground)]">Select two players above to compare</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]/60">Search and pick players from the fields above</p>
        </div>
      )}
    </div>
  )
}
