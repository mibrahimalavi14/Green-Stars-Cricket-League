import { prisma } from "@/lib/prisma"
import { Trophy, Shield, Star, Zap } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ROLES = ["Wicket-keeper", "Batsman", "Batsman", "Batsman", "Batsman", "All-rounder", "All-rounder", "Bowler", "Bowler", "Bowler", "Bowler"] as const

async function DreamTeamPage() {
  const players = await prisma.player.findMany({ include: { team: true } })
  const performances = await prisma.playerMatch.findMany({
    include: { player: { include: { team: true } } },
  })

  const stats = players.map(p => {
    const pPerfs = performances.filter(x => x.playerId === p.id)
    const runs = pPerfs.reduce((s, x) => s + x.battingRuns, 0)
    const ballsFaced = pPerfs.reduce((s, x) => s + x.ballsFaced, 0)
    const wickets = pPerfs.reduce((s, x) => s + x.bowlingWickets, 0)
    const dismissals = pPerfs.filter(x => x.isOut).length
    const catches = pPerfs.reduce((s, x) => s + x.catches, 0)
    const stumpings = pPerfs.reduce((s, x) => s + x.stumpings, 0)
    const ballsBowled = pPerfs.reduce((s, x) => s + x.ballsBowled, 0)
    const runsConceded = pPerfs.reduce((s, x) => s + x.bowlingRuns, 0)
    return { ...p, runs, ballsFaced, wickets, dismissals, catches, stumpings, ballsBowled, runsConceded, matchCount: pPerfs.length }
  })

  const wicketkeepers = stats.filter(p => p.role === "Wicket-keeper" && p.matchCount > 0).sort((a, b) => (b.runs + b.catches * 10 + b.stumpings * 15) - (a.runs + a.catches * 10 + a.stumpings * 15))
  const batsmen = stats.filter(p => (p.role === "Batsman" || p.role === "Wicket-keeper") && p.matchCount > 0).sort((a, b) => b.runs - a.runs)
  const allrounders = stats.filter(p => p.role === "All-rounder" && p.matchCount > 0).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))
  const bowlers = stats.filter(p => p.role === "Bowler" && p.matchCount > 0).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)

  const selected: typeof stats = []
  const used = new Set<string>()

  const wk = wicketkeepers[0]
  if (wk) { selected.push(wk); used.add(wk.id) }

  const topBatsmen = batsmen.filter(p => !used.has(p.id)).slice(0, 4)
  topBatsmen.forEach(p => { selected.push(p); used.add(p.id) })

  const topAR = allrounders.filter(p => !used.has(p.id)).slice(0, 2)
  topAR.forEach(p => { selected.push(p); used.add(p.id) })

  const topBowlers = bowlers.filter(p => !used.has(p.id)).slice(0, 4)
  topBowlers.forEach(p => { selected.push(p); used.add(p.id) })

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold flex items-center gap-3">
        <Trophy className="h-7 w-7 text-gscl-gold" />
        Team of the Season
      </h1>
      <p className="mb-10 text-[var(--muted-foreground)]">Best XI selected from season statistics</p>

      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {selected.map((p, i) => {
          const role = ROLES[i] || "Player"
          const sr = p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(1) : "-"
          const econ = p.ballsBowled > 0 ? (p.runsConceded / (p.ballsBowled / 6)).toFixed(2) : "-"
          const batAvg = p.dismissals > 0 ? (p.runs / p.dismissals).toFixed(2) : "-"
          return (
            <Link key={p.id} href={`/players/${p.id}`} className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gscl-gold/20 text-sm font-bold text-gscl-dark">
                  #{i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate group-hover:text-[var(--accent)]">{p.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{role} &middot; {p.team?.shortName}</p>
                </div>
                {p.team?.logo && <img src={p.team.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-[var(--muted)] p-1.5">
                  <p className="font-bold">{p.runs}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Runs</p>
                </div>
                <div className="rounded bg-[var(--muted)] p-1.5">
                  <p className="font-bold">{p.wickets}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Wkts</p>
                </div>
                <div className="rounded bg-[var(--muted)] p-1.5">
                  <p className="font-bold">{p.catches}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Ct</p>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[var(--muted-foreground)]">
                <span>SR: {sr}</span>
                <span>Avg: {batAvg}</span>
                {p.ballsBowled > 0 && <span>Econ: {econ}</span>}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--muted)] px-6 py-3">
          <h2 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Team Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Batting</h3>
              <div className="space-y-1 text-sm">
                <p>Total Runs: <span className="font-bold">{selected.reduce((s, p) => s + p.runs, 0)}</span></p>
                <p>Top Scorer: <span className="font-bold">{selected.sort((a, b) => b.runs - a.runs)[0]?.name}</span> ({selected.sort((a, b) => b.runs - a.runs)[0]?.runs})</p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Bowling</h3>
              <div className="space-y-1 text-sm">
                <p>Total Wickets: <span className="font-bold">{selected.reduce((s, p) => s + p.wickets, 0)}</span></p>
                <p>Top Wicket-taker: <span className="font-bold">{selected.sort((a, b) => b.wickets - a.wickets)[0]?.name}</span> ({selected.sort((a, b) => b.wickets - a.wickets)[0]?.wickets})</p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Fielding</h3>
              <div className="space-y-1 text-sm">
                <p>Total Catches: <span className="font-bold">{selected.reduce((s, p) => s + p.catches, 0)}</span></p>
                <p>Total Stumpings: <span className="font-bold">{selected.reduce((s, p) => s + p.stumpings, 0)}</span></p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Squad</h3>
              <div className="space-y-1 text-sm">
                <p>Batters: <span className="font-bold">4</span></p>
                <p>All-Rounders: <span className="font-bold">2</span></p>
                <p>Bowlers: <span className="font-bold">4</span></p>
                <p>Wicket-Keeper: <span className="font-bold">1</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DreamTeamPage
