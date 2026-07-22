import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function TossAnalysisPage() {
  const matches = await prisma.match.findMany({
    where: { status: "completed", tossWinner: { not: "" } },
    include: { team1: true, team2: true },
  })

  const teamMap = new Map<string, { name: string; logo: string; total: number; tossWon: number; bat: number; field: number; won: number; lost: number; tossWonMatchWon: number; tossLostMatchWon: number }>()

  function getTeamStats(id: string, name: string, logo: string) {
    if (!teamMap.has(id)) {
      teamMap.set(id, { name, logo, total: 0, tossWon: 0, bat: 0, field: 0, won: 0, lost: 0, tossWonMatchWon: 0, tossLostMatchWon: 0 })
    }
    return teamMap.get(id)!
  }

  let batFirstWins = 0, batFirstTotal = 0, chaseWins = 0, chaseTotal = 0

  for (const m of matches) {
    const winnerName = m.result?.includes("won by")
      ? m.result.includes(m.team1.name) ? m.team1.name : m.team2.name
      : null

    for (const team of [m.team1, m.team2]) {
      const s = getTeamStats(team.id, team.name, team.logo)
      s.total++
      const wonToss = m.tossWinner === team.id
      if (wonToss) {
        s.tossWon++
        if (m.tossDecision === "bat") s.bat++
        else s.field++
      }
      if (winnerName === team.name) {
        s.won++
        if (wonToss) s.tossWonMatchWon++
        else s.tossLostMatchWon++
      } else if (winnerName) {
        s.lost++
      }
    }

    if (m.tossDecision === "bat") {
      batFirstTotal++
      const battingTeam = m.tossWinner === m.team1.id ? m.team1 : m.team2
      if (winnerName === battingTeam.name) batFirstWins++
    } else {
      chaseTotal++
      const fieldingTeam = m.tossWinner === m.team1.id ? m.team1 : m.team2
      if (winnerName === fieldingTeam.name) chaseWins++
    }
  }

  const teams = [...teamMap.values()]
  const totalTossWonMatchWon = teams.reduce((a, s) => a + s.tossWonMatchWon, 0)
  const totalTossWon = teams.reduce((a, s) => a + s.tossWon, 0)
  const tossWinRate = totalTossWon ? Math.round(totalTossWonMatchWon / totalTossWon * 100) : 0
  const batFirstPct = batFirstTotal ? Math.round(batFirstWins / batFirstTotal * 100) : 0
  const chasePct = chaseTotal ? Math.round(chaseWins / chaseTotal * 100) : 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/" className="mb-4 inline-block text-sm text-[var(--accent)] hover:underline">&larr; Home</Link>
      <h1 className="mb-2 text-3xl font-bold">Toss Analysis</h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Based on {matches.length} completed match{matches.length !== 1 ? "es" : ""} with toss data
      </p>

      {matches.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)]">No toss data available yet.</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
              <div className="text-3xl font-bold text-[var(--accent)]">{tossWinRate}%</div>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">Toss Winner Match Win Rate</div>
              <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">{totalTossWonMatchWon}/{totalTossWon} matches</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
              <div className="text-3xl font-bold text-green-600">{batFirstPct}%</div>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">Win Rate Batting First</div>
              <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">{batFirstWins}/{batFirstTotal} matches</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
              <div className="text-3xl font-bold text-blue-600">{chasePct}%</div>
              <div className="mt-1 text-xs text-[var(--muted-foreground)]">Win Rate Chasing</div>
              <div className="mt-1 text-[10px] text-[var(--muted-foreground)]">{chaseWins}/{chaseTotal} matches</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="p-3 text-left">Team</th>
                  <th className="p-3 text-center">Played</th>
                  <th className="p-3 text-center">Toss Won</th>
                  <th className="p-3 text-center">Bat</th>
                  <th className="p-3 text-center">Field</th>
                  <th className="p-3 text-center">Won</th>
                  <th className="p-3 text-center">Lost</th>
                  <th className="p-3 text-center">Win % (Toss Won)</th>
                  <th className="p-3 text-center">Win % (Toss Lost)</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const tossWonWinPct = t.tossWon ? Math.round(t.tossWonMatchWon / t.tossWon * 100) : 0
                  const tossLostTotal = t.total - t.tossWon
                  const tossLostWinPct = tossLostTotal ? Math.round(t.tossLostMatchWon / tossLostTotal * 100) : 0
                  return (
                    <tr key={t.name} className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)] ${i % 2 === 0 ? "bg-[var(--card)]" : ""}`}>
                      <td className="p-3 font-medium">{t.name}</td>
                      <td className="p-3 text-center">{t.total}</td>
                      <td className="p-3 text-center font-semibold">{t.tossWon}</td>
                      <td className="p-3 text-center">{t.bat}</td>
                      <td className="p-3 text-center">{t.field}</td>
                      <td className="p-3 text-center text-green-600">{t.won}</td>
                      <td className="p-3 text-center text-red-500">{t.lost}</td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${tossWonWinPct >= 50 ? "text-green-600" : "text-red-500"}`}>{tossWonWinPct}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${tossLostWinPct >= 50 ? "text-green-600" : "text-red-500"}`}>{tossLostWinPct}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold">Toss Decision Breakdown</h3>
              {teams.map(t => {
                const pct = t.tossWon ? Math.round(t.bat / t.tossWon * 100) : 0
                return (
                  <div key={t.name} className="mb-2">
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{t.name}</span>
                      <span className="text-[var(--muted-foreground)]">{t.bat} bat / {t.field} field</span>
                    </div>
                    <div className="flex h-4 overflow-hidden rounded-full bg-[var(--muted)] text-[10px] font-medium text-white">
                      <div className="flex items-center justify-center bg-green-500" style={{ width: `${pct}%` }}>{pct > 15 ? `${pct}%` : ""}</div>
                      <div className="flex flex-1 items-center justify-center bg-blue-500">{(100 - pct) > 15 ? `${100 - pct}%` : ""}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold">Toss Winner Match Win Rate</h3>
              {teams.map(t => {
                const pct = t.tossWon ? Math.round(t.tossWonMatchWon / t.tossWon * 100) : 0
                return (
                  <div key={t.name} className="mb-2">
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{t.name}</span>
                      <span className="text-[var(--muted-foreground)]">{t.tossWonMatchWon}/{t.tossWon}</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div className="flex h-full items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-medium text-white" style={{ width: `${pct}%` }}>{pct > 10 ? `${pct}%` : ""}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TossAnalysisPage
