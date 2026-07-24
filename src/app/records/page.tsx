import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Trophy, Target, Zap, Shield, Award, TrendingUp, Star, CircleDot } from "lucide-react"

export const dynamic = "force-dynamic"

async function RecordsPage() {
  const [players, allMatches] = await Promise.all([
    prisma.player.findMany({
      where: { matchesPlayed: { gt: 0 } },
      orderBy: { runs: "desc" },
    }),
    prisma.match.findMany({
      where: { status: "completed" },
      include: { innings: true, team1: true, team2: true, season: true },
    }),
  ])

  const teamRecords = computeTeamRecords(allMatches)
  const playerRecords = computePlayerRecords(players)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Records</h1>
      <p className="mb-10 text-[var(--muted-foreground)]">All-time records across every season</p>

      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Shield className="h-5 w-5 text-[var(--accent)]" /> Team Records
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamRecords.map((r, i) => (
            <RecordCard key={i} {...r} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Star className="h-5 w-5 text-[var(--accent)]" /> Player Records
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playerRecords.map((r, i) => (
            <RecordCard key={i} {...r} />
          ))}
        </div>
      </section>
    </div>
  )
}

function RecordCard({ label, holder, value, href }: { label: string; holder: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]/50">
      <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
      <p className="text-lg font-bold text-[var(--accent)] mb-1">{value}</p>
      <p className="text-sm font-semibold truncate">{holder}</p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function computeTeamRecords(matches: any[]) {
  const teamMap = new Map<string, { name: string; shortName: string; logo: string; color: string; wins: number; highestScore: number; lowestScore: number; highestChase: number; totalSixes: number; totalFours: number }>()

  for (const m of matches) {
    for (const team of [m.team1, m.team2]) {
      if (!teamMap.has(team.id)) teamMap.set(team.id, { name: team.name, shortName: team.shortName, logo: team.logo, color: team.color, wins: 0, highestScore: 0, lowestScore: Infinity, highestChase: 0, totalSixes: 0, totalFours: 0 })
    }
    const result = m.result?.toLowerCase() || ""
    const t1 = teamMap.get(m.team1Id)!
    const t2 = teamMap.get(m.team2Id)!

    if (result.includes(m.team1.shortName?.toLowerCase())) t1.wins++
    if (result.includes(m.team2.shortName?.toLowerCase())) t2.wins++

    const inn1 = m.innings.find((i: any) => i.teamId === m.team1Id)
    const inn2 = m.innings.find((i: any) => i.teamId === m.team2Id)

    if (inn1) {
      const s = inn1.runs + inn1.extras
      t1.highestScore = Math.max(t1.highestScore, s)
      t1.lowestScore = Math.min(t1.lowestScore, s)
    }
    if (inn2) {
      const s = inn2.runs + inn2.extras
      t2.highestScore = Math.max(t2.highestScore, s)
      t2.lowestScore = Math.min(t2.lowestScore, s)
      if (inn1) {
        const target = inn1.runs + inn1.extras + 1
        if (s >= target) t2.highestChase = Math.max(t2.highestChase, s)
      }
    }
  }

  const records: { label: string; holder: string; value: string; href?: string }[] = []
  const teams = [...teamMap.values()].filter(t => t.highestScore > 0)

  if (teams.length > 0) {
    const hs = teams.reduce((a, b) => a.highestScore > b.highestScore ? a : b)
    records.push({ label: "Highest Team Score", holder: hs.shortName, value: `${hs.highestScore}` })

    const ls = teams.filter(t => t.lowestScore < Infinity).reduce((a, b) => a.lowestScore < b.lowestScore ? a : b, { lowestScore: Infinity, shortName: "-" })
    if (ls.lowestScore < Infinity) records.push({ label: "Lowest Team Score", holder: ls.shortName, value: `${ls.lowestScore}` })

    const hc = teams.filter(t => t.highestChase > 0).reduce((a, b) => a.highestChase > b.highestChase ? a : b, { highestChase: 0, shortName: "-" })
    if (hc.highestChase > 0) records.push({ label: "Highest Successful Chase", holder: hc.shortName, value: `${hc.highestChase}` })

    const mw = teams.reduce((a, b) => a.wins > b.wins ? a : b)
    records.push({ label: "Most Wins", holder: mw.shortName, value: `${mw.wins}` })
  }

  return records
}

function computePlayerRecords(players: any[]) {
  const records: { label: string; holder: string; value: string; href?: string }[] = []
  const active = players.filter(p => p.matchesPlayed > 0)

  if (active.length === 0) return records

  const mostRuns = active.reduce((a, b) => a.runs > b.runs ? a : b)
  records.push({ label: "Most Runs", holder: mostRuns.name, value: `${mostRuns.runs} runs`, href: `/players/${mostRuns.id}` })

  const mostWkts = [...active].sort((a, b) => b.wickets - a.wickets)[0]
  if (mostWkts.wickets > 0) records.push({ label: "Most Wickets", holder: mostWkts.name, value: `${mostWkts.wickets} wkts`, href: `/players/${mostWkts.id}` })

  const highestScore = active.reduce((a, b) => a.highestScore > b.highestScore ? a : b)
  records.push({ label: "Highest Individual Score", holder: highestScore.name, value: `${highestScore.highestScore}${highestScore.highestScoreNotOut ? "*" : ""}`, href: `/players/${highestScore.id}` })

  const bestBowling = active.filter(p => p.bestBowlingWickets > 0).reduce((a, b) => {
    if (a.bestBowlingWickets > b.bestBowlingWickets) return a
    if (a.bestBowlingWickets === b.bestBowlingWickets && a.bestBowlingRuns < b.bestBowlingRuns) return a
    return b
  }, { bestBowlingWickets: 0, bestBowlingRuns: 0, bestBowlingBalls: 0, name: "-" })
  if (bestBowling.bestBowlingWickets > 0) {
    const ov = bestBowling.bestBowlingBalls > 0 ? ` (${Math.floor(bestBowling.bestBowlingBalls / 6)}.${bestBowling.bestBowlingBalls % 6})` : ""
    records.push({ label: "Best Bowling Figures", holder: bestBowling.name, value: `${bestBowling.bestBowlingWickets}/${bestBowling.bestBowlingRuns}${ov}` })
  }

  const mostCatches = active.filter(p => p.catches > 0).reduce((a, b) => a.catches > b.catches ? a : b, { catches: 0, name: "-" })
  if (mostCatches.catches > 0) records.push({ label: "Most Catches", holder: mostCatches.name, value: `${mostCatches.catches}` })

  const mostFifties = active.filter(p => p.fifties > 0).reduce((a, b) => a.fifties > b.fifties ? a : b, { fifties: 0, name: "-" })
  if (mostFifties.fifties > 0) records.push({ label: "Most Fifties", holder: mostFifties.name, value: `${mostFifties.fifties}` })

  const bestSR = active.filter(p => p.runs >= 50 && p.ballsFaced > 0).reduce((a, b) => {
    const srA = (a.runs / a.ballsFaced) * 100
    const srB = (b.runs / b.ballsFaced) * 100
    return srA > srB ? a : b
  }, { runs: 0, ballsFaced: 1, name: "-" })
  if (bestSR.runs >= 50) records.push({ label: "Best Strike Rate (min 50 runs)", holder: bestSR.name, value: `${((bestSR.runs / bestSR.ballsFaced) * 100).toFixed(1)}` })

  const bestEcon = active.filter(p => p.ballsBowled >= 36).reduce((a, b) => {
    const eA = (a.runsConceded / a.ballsBowled) * 6
    const eB = (b.runsConceded / b.ballsBowled) * 6
    return eA < eB ? a : b
  }, { runsConceded: 999, ballsBowled: 1, name: "-" })
  if (bestEcon.ballsBowled >= 36) records.push({ label: "Best Economy (min 6 overs)", holder: bestEcon.name, value: `${((bestEcon.runsConceded / bestEcon.ballsBowled) * 6).toFixed(2)}` })

  const mostDucks = active.filter(p => p.ducks > 0).reduce((a, b) => a.ducks > b.ducks ? a : b, { ducks: 0, name: "-" })
  if (mostDucks.ducks > 0) records.push({ label: "Most Ducks", holder: mostDucks.name, value: `${mostDucks.ducks}` })

  return records
}

export default RecordsPage
