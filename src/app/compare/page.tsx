"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X, Crosshair, UserCheck, BarChart3, Trophy, Zap, Target, Eye } from "lucide-react"

type TeamInfo = { id: string; name: string; shortName: string; color: string; logo: string }
type Player = {
  id: string; name: string; role: string; battingStyle: string; bowlingStyle: string; photo: string; teamId: string; team: TeamInfo
  runs: number; ballsFaced: number; fours: number; sixes: number; ones: number; twos: number
  threes: number; dotBalls: number; highestScore: number
  fifties: number; hundreds: number; wickets: number; ballsBowled: number; runsConceded: number
  maidens: number; wides: number; noBalls: number; fiveWickets: number; fourWickets: number; hattricks: number
  matchesPlayed: number; bestBowlingWickets: number; bestBowlingRuns: number
  catches: number; stumpings: number; runOuts: number; notOuts: number; ducks: number
  timesBowled: number; timesCaught: number; timesLbw: number; timesStumped: number; timesRunOut: number
}

const RADAR_STATS = ["Runs", "Average", "Strike Rate", "Wickets", "Economy", "Catches"] as const
const COLOR_A = "var(--accent)"
const COLOR_B = "#f59e0b"

function calcAverage(runs: number, matches: number) { return matches > 0 ? runs / matches : 0 }
function calcStrikeRate(runs: number, balls: number) { return balls > 0 ? (runs / balls) * 100 : 0 }
function calcEconomy(runs: number, balls: number) { return balls > 0 ? (runs / (balls / 6)) : 0 }

function RadarChart({ player1, player2 }: { player1: Player; player2: Player }) {
  const size = 300
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size / 2 - 40
  const sides = 6
  const angleStep = (2 * Math.PI) / sides

  const rawValues = useMemo(() => {
    const a: number[] = [
      player1.runs,
      calcAverage(player1.runs, player1.matchesPlayed),
      calcStrikeRate(player1.runs, player1.ballsFaced),
      player1.wickets,
      calcEconomy(player1.runsConceded, player1.ballsBowled),
      player1.catches,
    ]
    const b: number[] = [
      player2.runs,
      calcAverage(player2.runs, player2.matchesPlayed),
      calcStrikeRate(player2.runs, player2.ballsFaced),
      player2.wickets,
      calcEconomy(player2.runsConceded, player2.ballsBowled),
      player2.catches,
    ]
    return { a, b }
  }, [player1, player2])

  const maxValues = useMemo(() => {
    return RADAR_STATS.map((_, i) => Math.max(rawValues.a[i], rawValues.b[i], 1))
  }, [rawValues])

  const valuesA = rawValues.a.map((v, i) => v / maxValues[i])
  const valuesB = rawValues.b.map((v, i) => v / maxValues[i])

  function getPoint(i: number, ratio: number) {
    const angle = -Math.PI / 2 + i * angleStep
    return { x: cx + Math.cos(angle) * maxRadius * ratio, y: cy + Math.sin(angle) * maxRadius * ratio }
  }

  function toPath(values: number[]) {
    return values.map((v, i) => {
      const p = getPoint(i, v)
      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    }).join(" ") + " Z"
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[340px]">
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={Array.from({ length: sides }, (_, i) => {
              const p = getPoint(i, level)
              return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
            }).join(" ")}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: sides }, (_, i) => {
          const p = getPoint(i, 1)
          return (
            <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth="1" />
          )
        })}
        <path d={toPath(valuesA)} fill={COLOR_A} fillOpacity="0.15" stroke={COLOR_A} strokeWidth="2.5" />
        <path d={toPath(valuesB)} fill={COLOR_B} fillOpacity="0.15" stroke={COLOR_B} strokeWidth="2.5" />
        {valuesA.map((v, i) => {
          const p = getPoint(i, v)
          return <circle key={`a${i}`} cx={p.x} cy={p.y} r="4" fill={COLOR_A} />
        })}
        {valuesB.map((v, i) => {
          const p = getPoint(i, v)
          return <circle key={`b${i}`} cx={p.x} cy={p.y} r="4" fill={COLOR_B} />
        })}
        {RADAR_STATS.map((label, i) => {
          const p = getPoint(i, 1.22)
          return (
            <text
              key={label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[var(--muted-foreground)] text-[10px] font-medium"
            >
              {label}
            </text>
          )
        })}
        {rawValues.a.map((v, i) => {
          const p = getPoint(i, valuesA[i])
          return (
            <text key={`va${i}`} x={p.x} y={p.y - 10} textAnchor="middle" className="fill-[var(--accent)] text-[8px] font-bold">
              {Math.round(v)}
            </text>
          )
        })}
        {rawValues.b.map((v, i) => {
          const p = getPoint(i, valuesB[i])
          return (
            <text key={`vb${i}`} x={p.x} y={p.y + 14} textAnchor="middle" className="fill-amber-500 text-[8px] font-bold">
              {Math.round(v)}
            </text>
          )
        })}
      </svg>
      <div className="mt-3 flex gap-6 text-xs">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_A }} />Player 1</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_B }} />Player 2</span>
      </div>
    </div>
  )
}

function PlayerSearch({ onSelect, excludeId }: { onSelect: (p: Player) => void; excludeId?: string }) {
  const [query, setQuery] = useState("")
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [results, setResults] = useState<Player[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch("/api/players").then(r => r.json()).then((data: Player[]) => {
      setAllPlayers(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (query.length < 1) { setResults([]); return }
    const filtered = allPlayers.filter(p => {
      if (excludeId && p.id === excludeId) return false
      return p.name.toLowerCase().includes(query.toLowerCase())
    }).slice(0, 10)
    setResults(filtered)
  }, [query, allPlayers, excludeId])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search player by name..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-xl">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(""); setResults([]); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--muted)]"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: p.team.color }}
              >
                {p.photo && p.photo !== "/placeholder-player.svg" ? (
                  <img src={p.photo} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                ) : p.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{p.team.shortName || p.team.name} &middot; {p.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 1 && results.length === 0 && !loading && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-center text-sm text-[var(--muted-foreground)] shadow-xl">
          No players found
        </div>
      )}
    </div>
  )
}

function PlayerCard({ player, label, color }: { player: Player; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="relative mb-3">
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-3"
          style={{ borderColor: color, backgroundColor: player.team.color }}
        >
          {player.photo && player.photo !== "/placeholder-player.svg" ? (
            <img src={player.photo} alt={player.name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">{player.name.charAt(0)}</span>
          )}
        </div>
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>
      <h3 className="text-lg font-bold">{player.name}</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{player.team.name}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium">{player.role}</span>
        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium">{player.battingStyle}</span>
        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-medium">{player.bowlingStyle}</span>
      </div>
    </div>
  )
}

type StatDef = { label: string; key: string; format?: (v: number, p: Player) => string; higherBetter?: boolean }
const BATTING_STATS: StatDef[] = [
  { label: "Runs", key: "runs" },
  { label: "Balls Faced", key: "ballsFaced" },
  { label: "Fours", key: "fours" },
  { label: "Sixes", key: "sixes" },
  { label: "Threes", key: "threes" },
  { label: "Dot Balls", key: "dotBalls" },
  { label: "Highest Score", key: "highestScore" },
  { label: "50s", key: "fifties" },
  { label: "100s", key: "hundreds" },
  { label: "Not Outs", key: "notOuts" },
  { label: "Ducks", key: "ducks", higherBetter: false },
  {
    label: "Average", key: "_avg",
    format: (v: number) => v.toFixed(2),
  },
  {
    label: "Strike Rate", key: "_sr",
    format: (v: number) => v.toFixed(2),
  },
  {
    label: "Boundary%", key: "_bdry",
    format: (_v: number, p?: Player) => p && p.runs > 0 ? (((p.fours * 4 + p.sixes * 6) / p.runs) * 100).toFixed(2) : "-",
  },
]
const BOWLING_STATS: StatDef[] = [
  { label: "Wickets", key: "wickets" },
  { label: "Balls Bowled", key: "ballsBowled" },
  { label: "Runs Conceded", key: "runsConceded", higherBetter: false },
  { label: "Maidens", key: "maidens" },
  { label: "Wides", key: "wides", higherBetter: false },
  { label: "No Balls", key: "noBalls", higherBetter: false },
  { label: "5 Wickets", key: "fiveWickets" },
  { label: "4 Wickets", key: "fourWickets" },
  { label: "Hattricks", key: "hattricks" },
  { label: "Best Bowling", key: "_bb", format: (_: number, p?: Player) => p ? `${p.bestBowlingWickets}/${p.bestBowlingRuns}` : "-" },
  { label: "Economy", key: "_econ", format: (v: number) => v.toFixed(2) },
  {
    label: "Bowling Avg", key: "_bowlavg",
    format: (v: number) => v.toFixed(2),
  },
  {
    label: "Bowling SR", key: "_bowlsr",
    format: (v: number) => v.toFixed(2),
  },
]
const FIELDING_STATS: StatDef[] = [
  { label: "Catches", key: "catches" },
  { label: "Stumpings", key: "stumpings" },
  { label: "Run Outs", key: "runOuts" },
  { label: "Times Bowled", key: "timesBowled" },
  { label: "Times Caught", key: "timesCaught" },
  { label: "Times LBW", key: "timesLbw" },
  { label: "Times Stumped", key: "timesStumped" },
  { label: "Times Run Out", key: "timesRunOut" },
]

function getStatValue(player: Player, key: string): number {
  const p = player as any
  switch (key) {
    case "_avg": return calcAverage(p.runs, p.matchesPlayed)
    case "_sr": return calcStrikeRate(p.runs, p.ballsFaced)
    case "_econ": return calcEconomy(p.runsConceded, p.ballsBowled)
    case "_bowlavg": return p.wickets > 0 ? p.runsConceded / p.wickets : 0
    case "_bowlsr": return p.wickets > 0 ? p.ballsBowled / p.wickets : 0
    default: return p[key] ?? 0
  }
}

function formatStatValue(player: Player, stat: StatDef): string {
  if (stat.format) {
    return stat.format(getStatValue(player, stat.key), player)
  }
  const v = getStatValue(player, stat.key)
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

function StatComparisonRow({ stat, player1, player2 }: { stat: StatDef; player1: Player; player2: Player }) {
  const v1 = getStatValue(player1, stat.key)
  const v2 = getStatValue(player2, stat.key)
  const higherBetter = stat.higherBetter !== false
  const leader = v1 > v2 ? "left" : v2 > v1 ? "right" : "tie"

  return (
    <tr className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]/30">
      <td className={`px-4 py-3 text-center font-semibold tabular-nums ${leader === "left" ? "text-[var(--accent)]" : ""}`}>
        {formatStatValue(player1, stat)}
      </td>
      <td className="px-4 py-3 text-center text-xs font-medium text-[var(--muted-foreground)]">{stat.label}</td>
      <td className={`px-4 py-3 text-center font-semibold tabular-nums ${leader === "right" ? "text-[var(--accent)]" : ""}`}>
        {formatStatValue(player2, stat)}
      </td>
    </tr>
  )
}

function StatSection({ title, icon: Icon, stats, player1, player2 }: { title: string; icon: any; stats: StatDef[]; player1: Player; player2: Player }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              <th className="px-4 py-2.5 text-center text-xs font-medium text-[var(--muted-foreground)]">Player 1</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-[var(--muted-foreground)]">Stat</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-[var(--muted-foreground)]">Player 2</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <StatComparisonRow key={s.key} stat={s} player1={player1} player2={player2} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [player1, setPlayer1] = useState<Player | null>(null)
  const [player2, setPlayer2] = useState<Player | null>(null)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
          <Crosshair className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Player Comparison</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Compare two players side by side across all stats</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Player 1</label>
          <PlayerSearch onSelect={setPlayer1} excludeId={player2?.id} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Player 2</label>
          <PlayerSearch onSelect={setPlayer2} excludeId={player1?.id} />
        </div>
      </div>

      {player1 && player2 ? (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <PlayerCard player={player1} label="P1" color={COLOR_A} />
            <PlayerCard player={player2} label="P2" color={COLOR_B} />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Eye className="h-4 w-4 text-[var(--accent)]" />
              Radar Overview
            </h3>
            <RadarChart player1={player1} player2={player2} />
          </div>

          <StatSection title="Batting Stats" icon={BarChart3} stats={BATTING_STATS} player1={player1} player2={player2} />
          <StatSection title="Bowling Stats" icon={Target} stats={BOWLING_STATS} player1={player1} player2={player2} />
          <StatSection title="Fielding Stats" icon={UserCheck} stats={FIELDING_STATS} player1={player1} player2={player2} />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] py-24 text-center">
          <Crosshair className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]/30" />
          <p className="text-lg text-[var(--muted-foreground)]">Select two players to compare</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]/50">Use the search fields above to pick players</p>
        </div>
      )}
    </div>
  )
}
