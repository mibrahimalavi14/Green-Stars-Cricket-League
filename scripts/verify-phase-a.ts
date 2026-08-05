/**
 * Phase A verification (targeted, DB-level).
 *
 * Builds a tiny synthetic season (4 teams, 4 completed matches with player
 * data + ball-by-ball data), then verifies the Phase A computations:
 *   - Fair Play table (lib/fair-play)
 *   - Season awards auto-generation (lib/season-awards)
 *   - Records incl. fastest_fifty / fastest_century / most_dot_balls (lib/records)
 *   - Season lock guard (lib/season-guard)
 * and cleans everything up afterwards.
 *
 * Usage: NODE_ENV=production tsx scripts/verify-phase-a.ts
 */
import { PrismaClient } from "@prisma/client"
import { computeFairPlayTable } from "../src/lib/fair-play"
import { autoGenerateSeasonAwards, computeSeasonAwardWinners } from "../src/lib/season-awards"
import { computeAllRecords } from "../src/lib/records"
import { isSeasonLocked } from "../src/lib/season-guard"

const prisma = new PrismaClient()
const MARKER = `VA-${Date.now()}`
let failures = 0

function check(label: string, cond: boolean, extra = "") {
  const ok = !!cond
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${label}${extra ? ` — ${extra}` : ""}`)
  if (!ok) failures++
}

async function main() {
  console.log(`\nPhase A verification (marker ${MARKER})`)

  const season = await prisma.season.create({
    data: { name: `VA-S1 ${MARKER}`, year: 2099, isActive: true },
  })

  const teamNames = ["VA Thunder", "VA Gladiators", "VA Hawks", "VA Kings"]
  const teams: { id: string; name: string }[] = []
  for (const name of teamNames) {
    teams.push(await prisma.team.create({ data: { name, shortName: name.slice(3), color: "#111111", seasonId: season.id } }))
  }

  const players: { id: string }[] = []
  const roles = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"]
  for (let t = 0; t < 4; t++) {
    for (let i = 0; i < 6; i++) {
      players.push(await prisma.player.create({ data: { name: `P${t}${i}`, role: roles[i % 4], teamId: teams[t].id } }))
    }
  }

  const perf = (playerId: string, teamId: string, matchId: string, data: Record<string, unknown>) =>
    prisma.playerMatch.create({ data: { playerId, teamId, matchId, isOut: false, ...data } })

  // Match 1: Thunder (64/3) vs Gladiators (58/6) — Thunder win
  const m1 = await prisma.match.create({
    data: {
      seasonId: season.id, matchNo: 1, stage: "league", status: "completed",
      date: new Date("2026-01-10T10:00:00Z"), venue: "VA Ground 1",
      team1Id: teams[0].id, team2Id: teams[1].id, winnerTeamId: teams[0].id,
      result: "VA Thunder won by 6 runs", manOfMatch: players[0].id, isSquadLocked: true,
    },
  })
  await prisma.inning.create({ data: { matchId: m1.id, teamId: teams[0].id, runs: 64, wickets: 3, balls: 24, extras: 4 } })
  await prisma.inning.create({ data: { matchId: m1.id, teamId: teams[1].id, runs: 58, wickets: 6, balls: 24, extras: 3 } })

  // Match 2: Hawks (74/2) vs Kings (71/5) — Hawks win
  const m2 = await prisma.match.create({
    data: {
      seasonId: season.id, matchNo: 2, stage: "league", status: "completed",
      date: new Date("2026-01-12T10:00:00Z"), venue: "VA Ground 2",
      team1Id: teams[2].id, team2Id: teams[3].id, winnerTeamId: teams[2].id,
      result: "VA Hawks won by 3 runs", manOfMatch: players[12].id, isSquadLocked: true,
    },
  })
  await prisma.inning.create({ data: { matchId: m2.id, teamId: teams[2].id, runs: 74, wickets: 2, balls: 24, extras: 5 } })
  await prisma.inning.create({ data: { matchId: m2.id, teamId: teams[3].id, runs: 71, wickets: 5, balls: 24, extras: 4 } })

  // Match 3: Thunder (40/4) vs Hawks (42/3) — Hawks win
  const m3 = await prisma.match.create({
    data: {
      seasonId: season.id, matchNo: 3, stage: "league", status: "completed",
      date: new Date("2026-01-14T10:00:00Z"), venue: "VA Ground 1",
      team1Id: teams[0].id, team2Id: teams[2].id, winnerTeamId: teams[2].id,
      result: "VA Hawks won by 7 wickets", isSquadLocked: true,
    },
  })
  await prisma.inning.create({ data: { matchId: m3.id, teamId: teams[0].id, runs: 40, wickets: 4, balls: 24, extras: 2 } })
  await prisma.inning.create({ data: { matchId: m3.id, teamId: teams[2].id, runs: 42, wickets: 3, balls: 18, extras: 1 } })

  // Match 4: Gladiators (45/6) vs Kings (48/5) — Kings win
  const m4 = await prisma.match.create({
    data: {
      seasonId: season.id, matchNo: 4, stage: "league", status: "completed",
      date: new Date("2026-01-16T10:00:00Z"), venue: "VA Ground 2",
      team1Id: teams[1].id, team2Id: teams[3].id, winnerTeamId: teams[3].id,
      result: "VA Kings won by 3 wickets", isSquadLocked: true,
    },
  })
  await prisma.inning.create({ data: { matchId: m4.id, teamId: teams[1].id, runs: 45, wickets: 6, balls: 24, extras: 2 } })
  await prisma.inning.create({ data: { matchId: m4.id, teamId: teams[3].id, runs: 48, wickets: 5, balls: 24, extras: 3 } })

  // Match 5: Thunder (52/3) vs Kings (48/6) — Thunder win (gives p0 a 3rd innings)
  const m5 = await prisma.match.create({
    data: {
      seasonId: season.id, matchNo: 5, stage: "league", status: "completed",
      date: new Date("2026-01-18T10:00:00Z"), venue: "VA Ground 1",
      team1Id: teams[0].id, team2Id: teams[3].id, winnerTeamId: teams[0].id,
      result: "VA Thunder won by 4 runs", isSquadLocked: true,
    },
  })
  await prisma.inning.create({ data: { matchId: m5.id, teamId: teams[0].id, runs: 52, wickets: 3, balls: 24, extras: 2 } })
  await prisma.inning.create({ data: { matchId: m5.id, teamId: teams[3].id, runs: 48, wickets: 6, balls: 24, extras: 3 } })

  // Batting: p0 = star batter (58(30) then 22(20)); p12 = 40*(24); p18 = 30(20)
  await perf(players[0].id, teams[0].id, m1.id, { battingRuns: 58, ballsFaced: 30, fours: 6, sixes: 2 })
  await perf(players[1].id, teams[0].id, m1.id, { battingRuns: 4, ballsFaced: 3, isOut: true })
  await perf(players[6].id, teams[1].id, m1.id, { battingRuns: 25, ballsFaced: 18, sixes: 1 })
  await perf(players[0].id, teams[0].id, m3.id, { battingRuns: 22, ballsFaced: 20, fours: 2 })
  await perf(players[0].id, teams[0].id, m5.id, { battingRuns: 12, ballsFaced: 10 })
  await perf(players[12].id, teams[2].id, m2.id, { battingRuns: 40, ballsFaced: 24, sixes: 5 })
  await perf(players[18].id, teams[3].id, m2.id, { battingRuns: 30, ballsFaced: 20, fours: 3 })
  await perf(players[6].id, teams[1].id, m4.id, { battingRuns: 15, ballsFaced: 12 })
  await perf(players[18].id, teams[3].id, m4.id, { battingRuns: 24, ballsFaced: 18, fours: 2 })

  // Bowling: p3 = 3/14 + 1/16 (best econ); p14 = 2/12 + 2/10
  await perf(players[3].id, teams[0].id, m1.id, { bowlingWickets: 3, bowlingRuns: 14, ballsBowled: 24, catches: 1 })
  await perf(players[7].id, teams[1].id, m1.id, { bowlingWickets: 2, bowlingRuns: 20, ballsBowled: 24 })
  await perf(players[3].id, teams[0].id, m3.id, { bowlingWickets: 2, bowlingRuns: 16, ballsBowled: 24 })
  await perf(players[14].id, teams[2].id, m2.id, { bowlingWickets: 2, bowlingRuns: 12, ballsBowled: 24, runOuts: 1 })
  await perf(players[21].id, teams[3].id, m2.id, { bowlingWickets: 1, bowlingRuns: 24, ballsBowled: 24 })
  await perf(players[14].id, teams[2].id, m3.id, { bowlingWickets: 2, bowlingRuns: 10, ballsBowled: 24 })
  await perf(players[7].id, teams[1].id, m4.id, { bowlingWickets: 1, bowlingRuns: 22, ballsBowled: 24 })
  await perf(players[21].id, teams[3].id, m4.id, { bowlingWickets: 3, bowlingRuns: 18, ballsBowled: 24 })

  // ball-by-ball for M1 innings 1: p0 faces all 30 legal balls, 4/1/0/6 pattern
  const ballsForP0: any[] = []
  for (let i = 0; i < 30; i++) {
    const runs = i < 24 ? (i % 3 === 0 ? 4 : i % 3 === 1 ? 1 : 0) : 6
    ballsForP0.push({ runs, extras: null, wicket: null, bowler: players[6].id, striker: players[0].id, nonStriker: players[1].id, wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0 })
  }
  await prisma.inning.updateMany({ where: { matchId: m1.id, teamId: teams[0].id }, data: { ballsData: JSON.stringify(ballsForP0) } })
  await prisma.inning.updateMany({ where: { matchId: m1.id, teamId: teams[1].id }, data: { ballsData: "[]" } })

  // ---- Fair Play ----
  console.log("\n  Fair Play:")
  await prisma.fairPlayRecord.create({ data: { seasonId: season.id, teamId: teams[0].id, warnings: 1, behavior: 0, sportsmanship: 8 } })
  await prisma.fairPlayRecord.create({ data: { seasonId: season.id, teamId: teams[1].id, warnings: 2, behavior: 0, sportsmanship: 7 } })
  await prisma.fairPlayRecord.create({ data: { seasonId: season.id, teamId: teams[2].id, warnings: 3, behavior: 0, sportsmanship: 5 } })
  await prisma.fairPlayRecord.create({ data: { seasonId: season.id, teamId: teams[3].id, warnings: 4, behavior: 0, sportsmanship: 4 } })
  await prisma.leaguePenalty.create({ data: { seasonId: season.id, teamId: teams[1].id, type: "points_deduction", points: 2, description: "VA test" } })

  const fp = await computeFairPlayTable(season.id)
  check("fair play table has 4 teams", fp.length === 4, `${fp.length}`)
  const t0 = fp.find(t => t.id === teams[0].id)
  check("t0 points = 111 (100-5+16)", t0?.fairPlayPoints === 111, `${t0?.fairPlayPoints}`)
  const t1 = fp.find(t => t.id === teams[1].id)
  check("t1 points = 102 (100-10-2+14)", t1?.fairPlayPoints === 102, `${t1?.fairPlayPoints}`)

  // ---- Awards ----
  console.log("\n  Season Awards:")
  // champion/runner-up deterministic via season.winnerId
  await prisma.season.update({ where: { id: season.id }, data: { winnerId: teams[0].id, runnerUpId: teams[1].id } })
  const winners = await computeSeasonAwardWinners(season.id)
  check("champion = Thunder", winners.some(w => w.category === "champion" && w.teamId === teams[0].id))
  check("runner_up = Gladiators", winners.some(w => w.category === "runner_up" && w.teamId === teams[1].id))
  check("orange cap = p0 (80 runs)", winners.find(w => w.category === "orange_cap")?.playerId === players[0].id)
  check("purple cap = p3 (5 wkts)", winners.find(w => w.category === "purple_cap")?.playerId === players[3].id)
  check("mvp = p0 (3+ innings)", winners.find(w => w.category === "mvp")?.playerId === players[0].id)
  check("best_batter = p0", winners.find(w => w.category === "best_batter")?.playerId === players[0].id)
  check("best_bowler = p14 (best econ)", winners.find(w => w.category === "best_bowler")?.playerId === players[14].id)
  check("best_fielder = p3", winners.find(w => w.category === "best_fielder")?.playerId === players[3].id)
  check("fair_play = t0 (111 pts)", winners.find(w => w.category === "fair_play")?.teamId === teams[0].id)

  const { count } = await autoGenerateSeasonAwards(season.id)
  check("auto-generate persisted 9 awards", count === 9, `count=${count}`)
  const stored = await prisma.seasonAward.findMany({ where: { seasonId: season.id } })
  check("stored awards count = 9", stored.length === 9, `${stored.length}`)
  check("orange cap value persisted", !!stored.find(a => a.category === "orange_cap")?.value.includes("92"))
  check("no duplicate champion (upsert idempotent)", stored.filter(a => a.category === "champion").length === 1)
  const again = await autoGenerateSeasonAwards(season.id)
  check("second run stays 9 (idempotent)", again.count === 9, `count=${again.count}`)

  // ---- Records ----
  console.log("\n  Records:")
  const { teamRecords, playerRecords } = await computeAllRecords()
  const fiftyRec = playerRecords.find(r => r.type === "fastest_fifty")
  check("fastest_fifty record exists", !!fiftyRec)
  check("fastest_fifty context present", !!fiftyRec?.seasonName && !!fiftyRec?.opponent && !!fiftyRec?.venue, `@${fiftyRec?.venue} vs ${fiftyRec?.opponent} (${fiftyRec?.seasonName})`)
  check("highest team score = Hawks 74", teamRecords.find(r => r.type === "highest_team_score")?.value === 74)
  const dotRec = playerRecords.find(r => r.type === "most_dot_balls")
  check("most_dot_balls computed (p0 dots > 0)", !!dotRec && dotRec.value > 0, `${dotRec?.value}`)

  // ---- Season lock ----
  console.log("\n  Season Lock:")
  check("season unlocked by default", (await isSeasonLocked(season.id)) === false)
  await prisma.season.update({ where: { id: season.id }, data: { isLocked: true, lockedReason: "VA test" } })
  check("season reports locked", (await isSeasonLocked(season.id)) === true)
  await prisma.season.update({ where: { id: season.id }, data: { isLocked: false } })
  check("season unlock works", (await isSeasonLocked(season.id)) === false)

  // ---- Cleanup ----
  console.log("\n  Cleanup...")
  await prisma.match.deleteMany({ where: { seasonId: season.id } })
  await prisma.playerMatch.deleteMany({ where: { teamId: { in: teams.map(t => t.id) } } })
  await prisma.team.deleteMany({ where: { seasonId: season.id } })
  await prisma.fairPlayRecord.deleteMany({ where: { seasonId: season.id } })
  await prisma.leaguePenalty.deleteMany({ where: { seasonId: season.id } })
  await prisma.seasonAward.deleteMany({ where: { seasonId: season.id } })
  await prisma.season.delete({ where: { id: season.id } })

  console.log(`\n  RESULT: ${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}\n`)
  await prisma.$disconnect()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(async e => {
  console.error("  VA ERROR:", e.message)
  failures++
  try { await prisma.$disconnect() } catch {}
  process.exit(1)
})
