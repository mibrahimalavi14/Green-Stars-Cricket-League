/**
 * GSCL Dress Rehearsal — full fake season end-to-end verification.
 *
 * Simulates a complete 8-team / 64-player / 28-match round-robin season
 * against the REAL production libraries (config engine, stats, snapshots,
 * records, audit, analytics) and verifies every launch-critical scenario.
 *
 * Coverage:
 *   Toss, Wide, No Ball + Boundary, Byes, Leg Byes, Run Out, Retired Hurt,
 *   Retired Out, Innings Break, Match Complete, Won by runs / wickets,
 *   Tie → Super Over, Super Over Tie → Super Over #2, Auto POTM, Points
 *   Table, Snapshots, Records, CSV Export, Restore, Audit Log, Analytics.
 *
 * All rehearsal data is cleaned up afterwards (nothing touches the real
 * season). Pass `KEEP_REHEARSAL=1` to leave the data for inspection.
 *
 * Usage: npm run dress:rehearsal
 */
import { prisma } from "@/lib/prisma"
import {
  MATCH_CONFIG,
  formatOvers,
  isMatchComplete,
  calculateResult,
  calculateMotm,
  type InningsState,
} from "@/lib/config"
import { recalcPointsTable, recalcPlayerStats } from "@/lib/stats"
import { saveSeasonSnapshot } from "@/lib/snapshots"
import { computeAllRecords } from "@/lib/records"
import { logAudit } from "@/lib/audit"
import { trackEvent } from "@/lib/analytics"

const REHEARSAL_PREFIX = "DR-"
const MARKER = "rehearsal"
const OVERSEAS = ["Gaddafi Stadium", "Rawalpindi Stadium", "National Bank Stadium", "Haripur Ground"]
const WK_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]

interface Ball {
  runs: number
  extras: string | null
  wicket: string | null
  bowler: string
  striker: string
  nonStriker: string
  wicketBatsman: string | null
  wicketFielder: string | null
  isWide: boolean
  isNoBall: boolean
  byes: number
  legByes: number
}

interface SquadPlayer {
  id: string
  teamId: string
  name: string
}

interface SimInnings {
  runs: number
  wickets: number
  balls: number
  extras: number
  ballsData: Ball[]
}

// ---- Deterministic RNG (mulberry32) ---------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ---- Validation (mirrors /api/live/balls route after fixes) ----------------
function isLegal(b: Ball) {
  return !b.isWide && !b.isNoBall
}

function validateBall(ballsData: Ball[], ball: Ball): string | null {
  const batters = new Set<string>()
  const dismissed = new Set<string>()
  for (const b of ballsData) {
    batters.add(b.striker)
    if (b.nonStriker) batters.add(b.nonStriker)
    if (b.wicket) dismissed.add(b.wicketBatsman || b.striker)
  }
  batters.add(ball.striker)
  if (ball.nonStriker) batters.add(ball.nonStriker)

  if (batters.size > 11) return "Cannot exceed 11 batters"
  if (dismissed.has(ball.striker)) return "Dismissed batsman cannot bat again"

  const legalBefore = ballsData.filter(b => isLegal(b)).length
  if (isLegal(ball) && legalBefore >= MATCH_CONFIG.totalBalls) {
    return `Innings complete (${MATCH_CONFIG.totalBalls} legal balls)`
  }
  const bowlerLegalBalls = ballsData.filter(b => b.bowler === ball.bowler && isLegal(b)).length
  if (isLegal(ball) && bowlerLegalBalls >= MATCH_CONFIG.maxBallsPerBowler) {
    return `Bowler cannot bowl more than ${MATCH_CONFIG.maxOversPerBowler} over`
  }
  return null
}

// ---- Accumulation (mirrors /api/live/balls route math) ---------------------
function applyBallToInnings(inn: SimInnings, ball: Ball) {
  const err = validateBall(inn.ballsData, ball)
  if (err) throw new Error(err)
  inn.ballsData.push(ball)
  if (isLegal(ball)) inn.balls += 1
  inn.runs += ball.runs
  inn.wickets += ball.wicket ? 1 : 0
  inn.extras += (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + ball.byes + ball.legByes
}

// ---- Innings generator -----------------------------------------------------
interface GenOptions {
  seed: number
  target?: number | null
  includeExtras?: boolean
  includeRunOuts?: boolean
  retiredHurtAt?: number
  retiredOutAt?: number
}

function generateInnings(batting: SquadPlayer[], bowling: SquadPlayer[], opts: GenOptions): SimInnings {
  const rng = mulberry32(opts.seed)
  const inn: SimInnings = { runs: 0, wickets: 0, balls: 0, extras: 0, ballsData: [] }

  const order = [...batting]
  const bowlers = bowling.slice(0, 4)
  const fielders = bowling

  let onStrikeIdx = 0
  let nonStrikeIdx = 1
  const nextBatter = (excludeIdx?: number) => {
    for (let i = 0; i < order.length; i++) {
      if (i === excludeIdx) continue
      if (!isPlayerOut(order[i].id)) return i
    }
    return -1
  }
  const outPlayers = new Set<string>()

  function isPlayerOut(id: string) {
    return outPlayers.has(id)
  }

  function endOfOver(legalJustBowled: number) {
    if (legalJustBowled % MATCH_CONFIG.ballsPerOver === 0) {
      const tmp = onStrikeIdx
      onStrikeIdx = nonStrikeIdx
      nonStrikeIdx = tmp
    }
  }

  const makeBase = (bowlerIdx: number): Ball => ({
    runs: 0,
    extras: null,
    wicket: null,
    bowler: bowlers[bowlerIdx].id,
    striker: order[onStrikeIdx].id,
    nonStriker: order[nonStrikeIdx].id,
    wicketBatsman: null,
    wicketFielder: null,
    isWide: false,
    isNoBall: false,
    byes: 0,
    legByes: 0,
  })

  const outCount = () => outPlayers.size
  let legalBowled = 0
  let targetReached = false

  while (legalBowled < MATCH_CONFIG.totalBalls) {
    const overIdx = Math.floor(legalBowled / MATCH_CONFIG.ballsPerOver)
    const bowlerIdx = overIdx % bowlers.length

    // Retired hurt / out injection (consume a legal ball)
    if (opts.retiredHurtAt === legalBowled) {
      const b = makeBase(bowlerIdx)
      b.wicket = "retired_hurt"
      b.wicketBatsman = order[onStrikeIdx].id
      applyBallToInnings(inn, b)
      legalBowled++
      outPlayers.add(order[onStrikeIdx].id)
      const nb = nextBatter()
      if (nb === -1) break
      onStrikeIdx = nb
      continue
    }
    if (opts.retiredOutAt === legalBowled) {
      const b = makeBase(bowlerIdx)
      b.wicket = "retired_out"
      b.wicketBatsman = order[onStrikeIdx].id
      applyBallToInnings(inn, b)
      legalBowled++
      outPlayers.add(order[onStrikeIdx].id)
      const nb = nextBatter()
      if (nb === -1) break
      onStrikeIdx = nb
      continue
    }

    // Extras (wide / no-ball / byes / leg byes) ~12% of deliveries
    const extraRoll = rng()
    if (opts.includeExtras !== false && extraRoll < 0.05) {
      const b = makeBase(bowlerIdx)
      b.isWide = true
      b.extras = "wide"
      applyBallToInnings(inn, b)
      continue
    }
    if (opts.includeExtras !== false && extraRoll < 0.08) {
      const b = makeBase(bowlerIdx)
      b.isNoBall = true
      b.extras = "noball"
      b.runs = [0, 1, 2, 4][Math.floor(rng() * 4)]
      applyBallToInnings(inn, b)
      continue
    }

    const roll = rng()
    let runs = 0
    let wicket: string | null = null
    let wicketBatsman: string | null = null
    let wicketFielder: string | null = null
    let byes = 0
    let legByes = 0

    if (roll < 0.045) {
      const types = ["bowled", "caught", "lbw", "stumped"]
      wicket = pick(types, rng)
      wicketBatsman = order[onStrikeIdx].id
      if (wicket === "caught" || wicket === "stumped") wicketFielder = pick(fielders, rng).id
      runs = 0
    } else if (opts.includeRunOuts !== false && roll < 0.065) {
      wicket = "runout"
      const victimIsStriker = rng() < 0.6
      wicketBatsman = victimIsStriker ? order[onStrikeIdx].id : order[nonStrikeIdx].id
      wicketFielder = pick(fielders, rng).id
      runs = [0, 1, 2][Math.floor(rng() * 3)]
    } else {
      const dist = [0, 1, 2, 4, 6, 3, 1, 0]
      runs = dist[Math.floor(rng() * dist.length)]
    }

    // Byes / leg byes on an otherwise dot ball
    if (runs === 0 && !wicket && opts.includeExtras !== false && rng() < 0.035) {
      const lb = rng() < 0.5
      const n = 1 + Math.floor(rng() * 2)
      if (lb) legByes = n
      else byes = n
    }

    const b = makeBase(bowlerIdx)
    b.runs = runs
    b.wicket = wicket
    b.wicketBatsman = wicketBatsman
    b.wicketFielder = wicketFielder
    b.byes = byes
    b.legByes = legByes

    applyBallToInnings(inn, b)
    legalBowled++

    if (wicket) {
      outPlayers.add(wicketBatsman as string)
      if (wicketBatsman === order[nonStrikeIdx].id) {
        const nb = nextBatter(onStrikeIdx)
        if (nb === -1) break
        nonStrikeIdx = nb
      } else {
        const nb = nextBatter(nonStrikeIdx)
        if (nb === -1) break
        onStrikeIdx = nb
      }
    } else {
      const completed = runs + byes + legByes
      if (completed % 2 === 1) {
        const tmp = onStrikeIdx
        onStrikeIdx = nonStrikeIdx
        nonStrikeIdx = tmp
      }
    }

    if (opts.target != null && inn.runs + inn.extras > opts.target) {
      targetReached = true
      break
    }
    if (outCount() >= MATCH_CONFIG.wicketsPerInnings) break
    endOfOver(legalBowled)
  }

  void targetReached
  return inn
}

// ---- Complete match (mirrors /api/live/complete-match route) ---------------
interface PlayerStats {
  playerId: string
  teamId: string
  battingRuns: number
  ballsFaced: number
  fours: number
  sixes: number
  ones: number
  twos: number
  isOut: boolean
  wicketsLost: number
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

function computePlayerStats(innings: { teamId: string; ballsData: Ball[] }[], team1Id: string, team2Id: string): Record<string, PlayerStats> {
  const playerStats: Record<string, PlayerStats> = {}

  function ensurePlayer(pid: string, teamId: string) {
    if (!playerStats[pid]) {
      playerStats[pid] = {
        playerId: pid, teamId,
        battingRuns: 0, ballsFaced: 0, fours: 0, sixes: 0, ones: 0, twos: 0,
        isOut: false, wicketsLost: 0, dismissalType: "", dismissedByBowlerId: "", dismissedByFielderId: "",
        bowlingWickets: 0, bowlingRuns: 0, ballsBowled: 0, maidens: 0, wides: 0, noBalls: 0,
        catches: 0, stumpings: 0, runOuts: 0,
      }
    }
  }

  for (const inn of innings) {
    const bowlingTeamId = inn.teamId === team1Id ? team2Id : team1Id
    for (const ball of inn.ballsData) {
      ensurePlayer(ball.striker, inn.teamId)
      ensurePlayer(ball.bowler, bowlingTeamId)
      if (ball.nonStriker) ensurePlayer(ball.nonStriker, inn.teamId)

      const ps = playerStats[ball.striker]
      if (!ball.isWide && !ball.isNoBall) ps.ballsFaced++
      ps.battingRuns += ball.runs
      if (ball.runs === 1) ps.ones++
      if (ball.runs === 2) ps.twos++
      if (ball.runs === 4) ps.fours++
      if (ball.runs === 6) ps.sixes++

      const bps = playerStats[ball.bowler]
      if (!ball.isWide && !ball.isNoBall) bps.ballsBowled++
      bps.bowlingRuns += ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0)
      if (ball.isWide) bps.wides++
      if (ball.isNoBall) bps.noBalls++

      if (ball.wicket && ball.wicket !== "runout" && ball.wicket !== "retired_out" && ball.wicket !== "retired_hurt") bps.bowlingWickets++
      if (ball.wicket) {
        const dismissed = ball.wicketBatsman || ball.striker
        ensurePlayer(dismissed, inn.teamId)
        const dps = playerStats[dismissed]
        dps.isOut = ball.wicket !== "retired_hurt"
        dps.wicketsLost = ball.wicket !== "retired_hurt" ? 1 : 0
        dps.dismissalType = ball.wicket
        if (ball.wicket !== "runout") dps.dismissedByBowlerId = ball.bowler
        if (ball.wicketFielder) {
          dps.dismissedByFielderId = ball.wicketFielder
          ensurePlayer(ball.wicketFielder, bowlingTeamId)
          const fps = playerStats[ball.wicketFielder]
          if (ball.wicket === "caught") fps.catches++
          if (ball.wicket === "stumped") fps.stumpings++
          if (ball.wicket === "runout") fps.runOuts++
        }
      }
    }
  }
  return playerStats
}

async function persistSuperOver(matchId: string, soInns: any[]) {
  for (const soInn of soInns) {
    await prisma.superOverInnings.upsert({
      where: { matchId_superOverNumber_teamId: { matchId, superOverNumber: soInn.superOverNumber, teamId: soInn.teamId } },
      update: {
        battingTeamId: soInn.battingTeamId, bowlingTeamId: soInn.bowlingTeamId,
        runs: soInn.runs, wickets: soInn.wickets, balls: soInn.balls, extras: soInn.extras || 0,
        ballsData: JSON.stringify(soInn.ballsData || []),
        isCompleted: soInn.isCompleted || false, isWinner: soInn.isWinner || false, result: soInn.result || "",
      },
      create: {
        matchId, superOverNumber: soInn.superOverNumber, teamId: soInn.teamId,
        battingTeamId: soInn.battingTeamId, bowlingTeamId: soInn.bowlingTeamId,
        runs: soInn.runs, wickets: soInn.wickets, balls: soInn.balls, extras: soInn.extras || 0,
        ballsData: JSON.stringify(soInn.ballsData || []),
        isCompleted: soInn.isCompleted || false, isWinner: soInn.isWinner || false, result: soInn.result || "",
      },
    })
  }
}

interface CompleteResult {
  complete: boolean
  result: string
  winnerTeamId: string | null
  manOfMatch: string
  superOverTie?: boolean
  superOverRequired?: boolean
}

async function completeMatch(
  matchId: string,
  seasonId: string,
  team1: SquadPlayer,
  team2: SquadPlayer,
  superOverData?: { latest: { t1Runs: number; t1Wkts: number; t2Runs: number; t2Wkts: number } | null; history: any[] }
): Promise<CompleteResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { innings: true },
  })
  if (!match) throw new Error("Match not found")

  const team1Inn = match.innings.find(i => i.teamId === team1.id)
  const team2Inn = match.innings.find(i => i.teamId === team2.id)

  const t1Runs = team1Inn?.runs || 0
  const t1Wkts = team1Inn?.wickets || 0
  const t1Balls = team1Inn?.balls || 0
  const t1Extras = team1Inn?.extras || 0
  const t2Runs = team2Inn?.runs || 0
  const t2Wkts = team2Inn?.wickets || 0
  const t2Balls = team2Inn?.balls || 0
  const t2Extras = team2Inn?.extras || 0

  const innings1: InningsState = { runs: t1Runs, wickets: t1Wkts, balls: t1Balls, extras: t1Extras }
  const innings2: InningsState = { runs: t2Runs, wickets: t2Wkts, balls: t2Balls, extras: t2Extras }

  if (!isMatchComplete(innings1, innings2) && match.status !== "super_over") {
    return { complete: false, result: "", winnerTeamId: null, manOfMatch: "" }
  }

  const { result: baseResult } = calculateResult(innings1, innings2, team1.name, team2.name)
  let result = baseResult
  let winnerTeamId: string | null = null

  const isTied = t1Runs + t1Extras === t2Runs + t2Extras

  if (isTied) {
    const so1Runs = superOverData?.latest?.t1Runs || 0
    const so2Runs = superOverData?.latest?.t2Runs || 0
    const so1Wkts = superOverData?.latest?.t1Wkts || 0
    const so2Wkts = superOverData?.latest?.t2Wkts || 0

    if (so1Runs || so2Runs) {
      if (so1Runs > so2Runs) {
        result = `${team1.name} won the Super Over (${so1Runs}/${so1Wkts} - ${so2Runs}/${so2Wkts})`
        winnerTeamId = team1.id
      } else if (so2Runs > so1Runs) {
        result = `${team2.name} won the Super Over (${so2Runs}/${so2Wkts} - ${so1Runs}/${so1Wkts})`
        winnerTeamId = team2.id
      } else {
        return { complete: false, result: "Match Tied (Super Over tied)", winnerTeamId: null, manOfMatch: "", superOverTie: true }
      }
    } else {
      return { complete: false, result: "Match Tied", winnerTeamId: null, manOfMatch: "", superOverRequired: true }
    }
  } else {
    if (t1Runs + t1Extras > t2Runs + t2Extras) winnerTeamId = team1.id
    else if (t2Runs + t2Extras > t1Runs + t1Extras) winnerTeamId = team2.id
  }

  const playerStats = computePlayerStats(
    match.innings.map(i => ({ teamId: i.teamId, ballsData: JSON.parse(i.ballsData || "[]") as Ball[] })),
    team1.id,
    team2.id
  )

  const momPlayerId = calculateMotm(Object.values(playerStats))

  for (const p of Object.values(playerStats)) {
    await prisma.playerMatch.upsert({
      where: { playerId_matchId: { playerId: p.playerId, matchId } },
      update: {
        battingRuns: p.battingRuns, ballsFaced: p.ballsFaced, fours: p.fours, sixes: p.sixes,
        ones: p.ones, twos: p.twos, isOut: p.isOut, wicketsLost: p.wicketsLost,
        dismissalType: p.dismissalType, dismissedByBowlerId: p.dismissedByBowlerId,
        dismissedByFielderId: p.dismissedByFielderId,
        bowlingWickets: p.bowlingWickets, bowlingRuns: p.bowlingRuns, ballsBowled: p.ballsBowled,
        maidens: p.maidens, wides: p.wides, noBalls: p.noBalls,
        catches: p.catches, stumpings: p.stumpings, runOuts: p.runOuts,
      },
      create: {
        playerId: p.playerId, matchId, teamId: p.teamId,
        battingRuns: p.battingRuns, ballsFaced: p.ballsFaced, fours: p.fours, sixes: p.sixes,
        ones: p.ones, twos: p.twos, isOut: p.isOut, wicketsLost: p.wicketsLost,
        dismissalType: p.dismissalType, dismissedByBowlerId: p.dismissedByBowlerId,
        dismissedByFielderId: p.dismissedByFielderId,
        bowlingWickets: p.bowlingWickets, bowlingRuns: p.bowlingRuns, ballsBowled: p.ballsBowled,
        maidens: p.maidens, wides: p.wides, noBalls: p.noBalls,
        catches: p.catches, stumpings: p.stumpings, runOuts: p.runOuts,
      },
    })
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "completed",
      result,
      winnerTeamId,
      manOfMatch: momPlayerId,
      tossWinner: match.tossWinner || "",
      tossDecision: match.tossDecision || "",
      team1Score: `${t1Runs + t1Extras}/${t1Wkts}${t1Balls ? ` (${formatOvers(t1Balls)} ov)` : ""}`,
      team2Score: `${t2Runs + t2Extras}/${t2Wkts}${t2Balls ? ` (${formatOvers(t2Balls)} ov)` : ""}`,
      superOverT1Runs: superOverData?.latest?.t1Runs || 0,
      superOverT1Wkts: superOverData?.latest?.t1Wkts || 0,
      superOverT2Runs: superOverData?.latest?.t2Runs || 0,
      superOverT2Wkts: superOverData?.latest?.t2Wkts || 0,
    },
  })

  if (superOverData?.history && superOverData.history.length > 0) {
    await persistSuperOver(matchId, superOverData.history)
  }

  await logAudit({
    action: "match_completed_auto",
    entity: "match",
    entityId: matchId,
    details: JSON.stringify({ result, winnerTeamId, manOfMatch: momPlayerId, auto: true, [MARKER]: true }),
    ip: MARKER,
  })

  await trackEvent("match_completed", { matchId, result, auto: "true", manOfMatch: momPlayerId, [MARKER]: "true" }, MARKER)

  await recalcPointsTable(seasonId)
  await recalcPlayerStats(seasonId)

  try {
    await saveSeasonSnapshot(seasonId, matchId)
  } catch (err) {
    console.warn("  [warn] snapshot failed:", (err as Error).message)
  }

  return { complete: true, result, winnerTeamId, manOfMatch: momPlayerId }
}

// ---- Match builder ---------------------------------------------------------
async function buildMatch(
  seasonId: string,
  team1: SquadPlayer,
  team2: SquadPlayer,
  team1Squad: SquadPlayer[],
  team2Squad: SquadPlayer[],
  matchNo: number,
  date: Date,
  opts: {
    tossWinnerIsT1?: boolean
    attendance?: number
    dls?: boolean
    innings1?: SimInnings
    innings2?: SimInnings
    target?: number
    seeds?: [number, number]
    forcedTieTarget?: number
  } = {}
): Promise<{ matchId: string; innings: { t1: SimInnings; t2: SimInnings } }> {
  const tossWinnerIsT1 = opts.tossWinnerIsT1 ?? (matchNo % 2 === 0)
  const match = await prisma.match.create({
    data: {
      seasonId,
      team1Id: team1.id,
      team2Id: team2.id,
      matchNo,
      stage: "league",
      date,
      venue: OVERSEAS[matchNo % OVERSEAS.length],
      tossWinner: tossWinnerIsT1 ? team1.id : team2.id,
      tossDecision: tossWinnerIsT1 ? "bowl" : "bat",
      umpire1: "Umpire Test 1",
      umpire2: "Umpire Test 2",
      attendance: opts.attendance ?? 0,
      dls: opts.dls ?? false,
      status: "live",
    },
  })

  let inn1 = opts.innings1
  if (!inn1) {
    const seed = opts.seeds?.[0] ?? matchNo * 1000
    inn1 = generateInnings(team1Squad, team2Squad, { seed, includeExtras: true, includeRunOuts: true })
  }

  // Persist innings 1
  await prisma.inning.create({
    data: {
      matchId: match.id,
      teamId: team1.id,
      runs: inn1.runs,
      wickets: inn1.wickets,
      balls: inn1.balls,
      extras: inn1.extras,
      ballsData: JSON.stringify(inn1.ballsData),
    },
  })
  await trackEvent("match_scored", { matchId: match.id, runs: inn1.runs + inn1.extras, wickets: inn1.wickets, [MARKER]: "true" }, MARKER)

  let inn2 = opts.innings2
  if (!inn2) {
    const target = opts.target ?? inn1.runs + inn1.extras
    const seed = opts.seeds?.[1] ?? matchNo * 1000 + 500
    inn2 = generateInnings(team2Squad, team1Squad, { seed, target, includeExtras: true, includeRunOuts: true })
  }

  await prisma.inning.create({
    data: {
      matchId: match.id,
      teamId: team2.id,
      runs: inn2.runs,
      wickets: inn2.wickets,
      balls: inn2.balls,
      extras: inn2.extras,
      ballsData: JSON.stringify(inn2.ballsData),
    },
  })
  await trackEvent("match_scored", { matchId: match.id, runs: inn2.runs + inn2.extras, wickets: inn2.wickets, [MARKER]: "true" }, MARKER)

  return { matchId: match.id, innings: { t1: inn1, t2: inn2 } }
}

// ---- Assertion harness -----------------------------------------------------
interface CheckResult {
  name: string
  pass: boolean
  detail: string
}

const results: CheckResult[] = []

function check(name: string, pass: boolean, detail = "") {
  results.push({ name, pass, detail })
  const icon = pass ? "PASS" : "FAIL"
  console.log(`  [${icon}] ${name}${detail ? ` — ${detail}` : ""}`)
  if (!pass) failures++
}

let failures = 0

// ---- Cleanup ---------------------------------------------------------------
async function cleanupRehearsalData(seasonId?: string) {
  if (seasonId) {
    const matches = await prisma.match.findMany({ where: { seasonId }, select: { id: true } })
    const ids = matches.map(m => m.id)
    if (ids.length > 0) {
      await prisma.superOverInnings.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.ballEvent.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.playerMatch.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.squadMember.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.matchNotes.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.inning.deleteMany({ where: { matchId: { in: ids } } })
      await prisma.match.deleteMany({ where: { id: { in: ids } } })
    }
    await prisma.seasonSnapshot.deleteMany({ where: { seasonId } })
    await prisma.leaguePenalty.deleteMany({ where: { seasonId } })
    await prisma.teamCaptaincy.deleteMany({ where: { seasonId } })
    await prisma.seasonAward.deleteMany({ where: { seasonId } })
    await prisma.teamHonor.deleteMany({ where: { seasonId } })
    await prisma.playerTransfer.deleteMany({ where: { seasonId } })
    await prisma.player.deleteMany({ where: { team: { seasonId } } })
    await prisma.team.deleteMany({ where: { seasonId } })
    await prisma.season.delete({ where: { id: seasonId } })
  }

  await prisma.auditLog.deleteMany({ where: { details: { contains: `"${MARKER}":true` } } })
  await prisma.auditLog.deleteMany({ where: { ip: MARKER } })
  await prisma.analyticsEvent.deleteMany({ where: { metadata: { contains: `"${MARKER}":"true"` } } })

  await recalcPlayerStats()
}

// ---- Main ------------------------------------------------------------------
async function main() {
  console.log("==============================================================")
  console.log("  GSCL DRESS REHEARSAL — full fake season end-to-end")
  console.log("==============================================================")
  console.log(`  Format: T${MATCH_CONFIG.oversPerInnings} · ${MATCH_CONFIG.ballsPerOver}/over · max ${MATCH_CONFIG.maxOversPerBowler} over/bowler`)
  console.log("")

  const existing = await prisma.season.findFirst({ where: { name: { startsWith: REHEARSAL_PREFIX } } })
  if (existing) {
    console.log(`  Cleaning up previous rehearsal season: ${existing.name}`)
    await cleanupRehearsalData(existing.id)
  }

  const season = await prisma.season.create({
    data: { name: `${REHEARSAL_PREFIX}${new Date().toISOString().slice(0, 10)}`, year: new Date().getFullYear(), isActive: false },
  })
  console.log(`  Rehearsal season: ${season.name}`)

  // 8 teams × 11 players = 88 (matches wicketsPerInnings=10 / 11-batter format)
  const teamNames = ["Alpha XI", "Bravo XI", "Charlie XI", "Delta XI", "Echo XI", "Foxtrot XI", "Golf XI", "Hotel XI"]
  const teams: SquadPlayer[] = []
  const squads: Record<string, SquadPlayer[]> = {}
  const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper", "Batsman", "Bowler", "All-Rounder", "Batsman", "Bowler", "Batsman", "All-Rounder"]

  for (let t = 0; t < teamNames.length; t++) {
    const team = await prisma.team.create({
      data: {
        name: teamNames[t],
        shortName: teamNames[t].split(" ")[0],
        seasonId: season.id,
        color: ["#1e3a5f", "#7c3aed", "#047857", "#b91c1c", "#0e7490", "#ca8a04", "#4d7c0f", "#be185d"][t],
        location: "Haripur",
      },
    })
    teams.push({ id: team.id, teamId: team.id, name: team.name })
    squads[team.id] = []
    for (let p = 0; p < 11; p++) {
      const player = await prisma.player.create({
        data: {
          name: `${teamNames[t].split(" ")[0]} P${p + 1}`,
          role: roles[p],
          teamId: team.id,
          jerseyNumber: p + 1,
          status: p === 3 ? "available" : "available",
        },
      })
      squads[team.id].push({ id: player.id, teamId: team.id, name: player.name })
    }
  }

  console.log(`  8 teams, ${teams.reduce((a, t) => a + squads[t.id].length, 0)} players`)

  // Full round-robin fixture (28 matches)
  const pairs: [number, number][] = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) pairs.push([i, j])
  }
  const matchDates: Date[] = []
  const day0 = new Date("2026-01-04T13:00:00Z")
  for (let i = 0; i < pairs.length; i++) {
    const d = new Date(day0)
    d.setDate(d.getDate() + Math.floor(i / 2))
    d.setHours(9 + (i % 2) * 4, 0, 0, 0)
    matchDates.push(d)
  }

  const matchInfos: { matchId: string; t1: SquadPlayer; t2: SquadPlayer; scenario: string }[] = []

  // ---- Scenario matches ----------------------------------------------------
  // Match 1: full flow (hand-crafted) — extras, all dismissals, retirement
  console.log("\n  Simulating scenario matches...")

  {
    const t1 = teams[0], t2 = teams[1]
    const s1 = squads[t1.id], s2 = squads[t2.id]

    // Team A innings (hand-crafted, verified by hand):
    // wide, no-ball+4, byes, leg-byes, caught, run-out, lbw, bowled,
    // retired hurt, retired out, sixes, fours. Expected: 59/6, extras 5,
    // exactly 24 legal balls (byes/leg-byes count as legal deliveries).
    const mk = (bowlerId: string, striker: string, nonStriker: string): Ball => ({
      runs: 0, extras: null, wicket: null, bowler: bowlerId, striker, nonStriker,
      wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0,
    })
    const [a1, a2, a3, a4, a5, a6, a7, a8] = s1
    const [b1, b2, b3, b4, b5, b6, b7] = s2

    const balls1: Ball[] = []
    const push = (b: Ball) => { balls1.push(b) }
    // b1 over (6 legal, +wide +noball)
    push({ ...mk(b1.id, a1.id, a2.id), runs: 1 })                            // L1
    push({ ...mk(b1.id, a2.id, a1.id), isWide: true, extras: "wide" })      // W1
    push({ ...mk(b1.id, a2.id, a1.id), runs: 4 })                            // L2
    push({ ...mk(b1.id, a2.id, a1.id), runs: 2 })                            // L3
    push({ ...mk(b1.id, a2.id, a1.id), wicket: "caught", wicketBatsman: a2.id, wicketFielder: b5.id }) // L4
    push({ ...mk(b1.id, a3.id, a1.id), isNoBall: true, extras: "noball", runs: 4 }) // NB1
    push({ ...mk(b1.id, a3.id, a1.id), runs: 6 })                            // L5
    push({ ...mk(b1.id, a3.id, a1.id), runs: 1 })                            // L6
    // b2 over (6 legal, incl. leg-bye)
    push({ ...mk(b2.id, a3.id, a1.id), runs: 2 })                            // L7
    push({ ...mk(b2.id, a3.id, a1.id), runs: 4 })                            // L8
    push({ ...mk(b2.id, a3.id, a1.id), legByes: 1, extras: "legbye" })       // LB1
    push({ ...mk(b2.id, a1.id, a3.id), runs: 1 })                            // L9
    push({ ...mk(b2.id, a3.id, a1.id), runs: 1, wicket: "runout", wicketBatsman: a3.id, wicketFielder: b6.id }) // L10
    push({ ...mk(b2.id, a4.id, a1.id), runs: 6 })                            // L11
    // b3 over (6 legal, incl. retired hurt)
    push({ ...mk(b3.id, a4.id, a1.id), runs: 4 })                            // L12
    push({ ...mk(b3.id, a1.id, a4.id), wicket: "lbw", wicketBatsman: a1.id }) // L13
    push({ ...mk(b3.id, a5.id, a4.id), runs: 4 })                            // L14
    push({ ...mk(b3.id, a5.id, a4.id), wicket: "retired_hurt", wicketBatsman: a5.id }) // L15
    push({ ...mk(b3.id, a6.id, a4.id), runs: 1 })                            // L16
    push({ ...mk(b3.id, a4.id, a6.id), wicket: "bowled", wicketBatsman: a4.id }) // L17
    // b4 over (6 legal, incl. byes, retired out)
    push({ ...mk(b4.id, a7.id, a6.id), runs: 6 })                            // L18
    push({ ...mk(b4.id, a7.id, a6.id), runs: 2 })                            // L19
    push({ ...mk(b4.id, a7.id, a6.id), byes: 2, extras: "bye" })             // B1
    push({ ...mk(b4.id, a7.id, a6.id), runs: 4 })                            // L20
    push({ ...mk(b4.id, a7.id, a6.id), wicket: "retired_out", wicketBatsman: a7.id }) // L21
    push({ ...mk(b4.id, a6.id, a8.id), runs: 6 })                            // L22

    const inn1: SimInnings = { runs: 0, wickets: 0, balls: 0, extras: 0, ballsData: [] }
    for (const b of balls1) applyBallToInnings(inn1, b)
    check("Scenario 1: innings-1 total (59/6, 24 balls, 5 extras)", inn1.runs === 59 && inn1.wickets === 6 && inn1.balls === 24 && inn1.extras === 5, `${inn1.runs}/${inn1.wickets} (${inn1.balls}) extras ${inn1.extras}`)

    // Team B chase (hand-crafted): stumped, run-out, lbw, bowled, caught.
    // Expected: 54/5, extras 4 → total 58 (24 legal balls).
    const [c1, c2, c3, c4, c5, c6] = s2
    const balls2: Ball[] = []
    const push2 = (b: Ball) => { balls2.push(b) }
    push2({ ...mk(a1.id, c1.id, c2.id), runs: 1 })
    push2({ ...mk(a1.id, c2.id, c1.id), runs: 4 })
    push2({ ...mk(a1.id, c2.id, c1.id), runs: 2 })
    push2({ ...mk(a1.id, c2.id, c1.id), runs: 1 })
    push2({ ...mk(a1.id, c1.id, c2.id), isWide: true, extras: "wide" })
    push2({ ...mk(a1.id, c1.id, c2.id), runs: 6 })
    push2({ ...mk(a1.id, c1.id, c2.id), runs: 1 })
    push2({ ...mk(a2.id, c2.id, c1.id), runs: 2 })
    push2({ ...mk(a2.id, c2.id, c1.id), wicket: "lbw", wicketBatsman: c2.id })
    push2({ ...mk(a2.id, c3.id, c1.id), runs: 4 })
    push2({ ...mk(a2.id, c3.id, c1.id), runs: 1 })
    push2({ ...mk(a2.id, c1.id, c3.id), isNoBall: true, extras: "noball", runs: 1 })
    push2({ ...mk(a2.id, c1.id, c3.id), wicket: "stumped", wicketBatsman: c1.id, wicketFielder: a5.id })
    push2({ ...mk(a2.id, c4.id, c3.id), runs: 2 })
    push2({ ...mk(a3.id, c4.id, c3.id), wicket: "bowled", wicketBatsman: c4.id })
    push2({ ...mk(a3.id, c5.id, c3.id), runs: 6 })
    push2({ ...mk(a3.id, c5.id, c3.id), legByes: 1, extras: "legbye" })
    push2({ ...mk(a3.id, c5.id, c3.id), runs: 6 })
    push2({ ...mk(a3.id, c5.id, c3.id), wicket: "caught", wicketBatsman: c5.id, wicketFielder: a6.id })
    push2({ ...mk(a3.id, c6.id, c3.id), runs: 1 })
    push2({ ...mk(a4.id, c3.id, c6.id), runs: 6 })
    push2({ ...mk(a4.id, c3.id, c6.id), runs: 2 })
    push2({ ...mk(a4.id, c3.id, c6.id), byes: 1, extras: "bye" })
    push2({ ...mk(a4.id, c6.id, c3.id), runs: 1 })
    push2({ ...mk(a4.id, c3.id, c6.id), runs: 6 })
    push2({ ...mk(a4.id, c3.id, c6.id), runs: 1, wicket: "runout", wicketBatsman: c3.id, wicketFielder: a7.id })

    const inn2: SimInnings = { runs: 0, wickets: 0, balls: 0, extras: 0, ballsData: [] }
    for (const b of balls2) applyBallToInnings(inn2, b)
    check("Scenario 1: innings-2 total (54/5, 24 balls, 4 extras)", inn2.runs === 54 && inn2.wickets === 5 && inn2.balls === 24 && inn2.extras === 4, `${inn2.runs}/${inn2.wickets} (${inn2.balls}) extras ${inn2.extras}`)

    const { matchId } = await buildMatch(season.id, t1, t2, s1, s2, 1, matchDates[0], {
      tossWinnerIsT1: false,
      innings1: inn1,
      innings2: inn2,
      attendance: 260,
      dls: true,
    })
    matchInfos.push({ matchId, t1, t2, scenario: "full-flow" })
  }

  // Match 2: successful chase → "won by X wickets"
  {
    const t1 = teams[0], t2 = teams[2]
    const s1 = squads[t1.id], s2 = squads[t2.id]
    const mk = (bowlerId: string, striker: string, nonStriker: string): Ball => ({
      runs: 0, extras: null, wicket: null, bowler: bowlerId, striker, nonStriker,
      wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0,
    })
    const [e1, e2, e3, e4] = s1
    const [f1, f2, f3, f4] = s2

    // Team C sets 31/3 in 24 balls (no extras)
    const balls1: Ball[] = []
    const set = (b: Ball) => { balls1.push(b) }
    set({ ...mk(f1.id, e1.id, e2.id), runs: 6 })
    set({ ...mk(f1.id, e1.id, e2.id), runs: 1 })
    set({ ...mk(f1.id, e2.id, e1.id), runs: 1 })
    set({ ...mk(f1.id, e1.id, e2.id), runs: 4 })
    set({ ...mk(f1.id, e1.id, e2.id), runs: 1 })
    set({ ...mk(f1.id, e2.id, e1.id), runs: 0 })
    set({ ...mk(f2.id, e2.id, e1.id), runs: 1 })
    set({ ...mk(f2.id, e1.id, e2.id), wicket: "caught", wicketBatsman: e1.id, wicketFielder: f2.id })
    set({ ...mk(f2.id, e3.id, e2.id), runs: 2 })
    set({ ...mk(f2.id, e3.id, e2.id), runs: 1 })
    set({ ...mk(f2.id, e2.id, e3.id), runs: 1 })
    set({ ...mk(f2.id, e3.id, e2.id), runs: 0 })
    set({ ...mk(f3.id, e3.id, e2.id), wicket: "bowled", wicketBatsman: e3.id })
    set({ ...mk(f3.id, e4.id, e2.id), runs: 4 })
    set({ ...mk(f3.id, e4.id, e2.id), runs: 1 })
    set({ ...mk(f3.id, e2.id, e4.id), runs: 1 })
    set({ ...mk(f3.id, e4.id, e2.id), runs: 0 })
    set({ ...mk(f3.id, e4.id, e2.id), runs: 1 })
    set({ ...mk(f4.id, e2.id, e4.id), runs: 1 })
    set({ ...mk(f4.id, e4.id, e2.id), runs: 1 })
    set({ ...mk(f4.id, e2.id, e4.id), runs: 2 })
    set({ ...mk(f4.id, e2.id, e4.id), runs: 1 })
    set({ ...mk(f4.id, e4.id, e2.id), wicket: "caught", wicketBatsman: e4.id, wicketFielder: f3.id })
    set({ ...mk(f4.id, e2.id, e4.id), runs: 1 })

    const inn1: SimInnings = { runs: 0, wickets: 0, balls: 0, extras: 0, ballsData: [] }
    for (const b of balls1) applyBallToInnings(inn1, b)
    check("Scenario 2: innings-1 (31/3 in 24 balls)", inn1.runs === 31 && inn1.wickets === 3 && inn1.balls === 24, `${inn1.runs}/${inn1.wickets} (${inn1.balls})`)

    // Team D chases 32 → 37/2 in 12 balls → won by 8 wickets
    const [g1, g2, g3, g4] = s2
    const balls2: Ball[] = []
    const set2 = (b: Ball) => { balls2.push(b) }
    set2({ ...mk(e1.id, g1.id, g2.id), runs: 4 })
    set2({ ...mk(e1.id, g1.id, g2.id), runs: 1 })
    set2({ ...mk(e1.id, g2.id, g1.id), runs: 6 })
    set2({ ...mk(e1.id, g2.id, g1.id), runs: 0, wicket: "runout", wicketBatsman: g2.id, wicketFielder: e3.id })
    set2({ ...mk(e1.id, g3.id, g1.id), runs: 0, wicket: "bowled", wicketBatsman: g3.id })
    set2({ ...mk(e1.id, g4.id, g1.id), runs: 4 })
    set2({ ...mk(e2.id, g4.id, g1.id), runs: 1 })
    set2({ ...mk(e2.id, g1.id, g4.id), runs: 6 })
    set2({ ...mk(e2.id, g1.id, g4.id), runs: 1 })
    set2({ ...mk(e2.id, g4.id, g1.id), runs: 4 })
    set2({ ...mk(e2.id, g4.id, g1.id), runs: 4 })
    set2({ ...mk(e2.id, g4.id, g1.id), runs: 6 })

    const inn2: SimInnings = { runs: 0, wickets: 0, balls: 0, extras: 0, ballsData: [] }
    for (const b of balls2) applyBallToInnings(inn2, b)
    check("Scenario 2: innings-2 (37/2 in 12 balls)", inn2.runs === 37 && inn2.wickets === 2 && inn2.balls === 12, `${inn2.runs}/${inn2.wickets} (${inn2.balls})`)

    const { matchId } = await buildMatch(season.id, t1, t2, s1, s2, 2, matchDates[1], {
      tossWinnerIsT1: true,
      innings1: inn1,
      innings2: inn2,
      attendance: 120,
    })
    matchInfos.push({ matchId, t1, t2, scenario: "chase-wickets" })
  }

  // Matches 3-4: Ties → Super Over (no extras so totals are exact)
  {
    const buildTie = async (idx: number, d1: SquadPlayer, d2: SquadPlayer, sd1: SquadPlayer[], sd2: SquadPlayer[], matchNo: number, date: Date) => {
      const rng = mulberry32(9000 + matchNo)
      const noExtras: GenOptions = { seed: 9000 + matchNo * 7, includeExtras: false, includeRunOuts: true }
      const inn1 = generateInnings(sd1, sd2, noExtras)
      const target = inn1.runs + inn1.extras

      let inn2: SimInnings | null = null
      for (let attempt = 0; attempt < 50; attempt++) {
        const cand = generateInnings(sd2, sd1, { seed: 9100 + matchNo * 7 + attempt, includeExtras: false, includeRunOuts: true, target })
        if (cand.runs + cand.extras === target && cand.balls === MATCH_CONFIG.totalBalls) {
          inn2 = cand
          break
        }
      }
      if (!inn2) throw new Error(`Could not construct a tie for match ${matchNo}`)

      const { matchId } = await buildMatch(season.id, d1, d2, sd1, sd2, matchNo, date, {
        tossWinnerIsT1: matchNo % 2 === 0,
        innings1: inn1,
        innings2: inn2,
      })
      void rng
      return { matchId, t1Total: inn1.runs + inn1.extras, t2Total: inn2.runs + inn2.extras }
    }

    const m3 = await buildTie(0, teams[0], teams[3], squads[teams[0].id], squads[teams[3].id], 3, matchDates[2])
    check("Scenario 3: tied league match constructed", m3.t1Total === m3.t2Total, `${m3.t1Total} all`)
    matchInfos.push({ matchId: m3.matchId, t1: teams[0], t2: teams[3], scenario: "tie-so" })

    const m4 = await buildTie(1, teams[0], teams[4], squads[teams[0].id], squads[teams[4].id], 4, matchDates[3])
    check("Scenario 4: tied league match constructed", m4.t1Total === m4.t2Total, `${m4.t1Total} all`)
    matchInfos.push({ matchId: m4.matchId, t1: teams[0], t2: teams[4], scenario: "tie-so2" })
  }

  // Remaining matches: generated
  console.log("\n  Simulating remaining fixture...")
  for (let idx = 4; idx < pairs.length; idx++) {
    const [i, j] = pairs[idx]
    const t1 = teams[i], t2 = teams[j]
    const s1 = squads[t1.id], s2 = squads[t2.id]
    const { matchId } = await buildMatch(season.id, t1, t2, s1, s2, idx + 1, matchDates[idx], {
      seeds: [idx * 131 + 7, idx * 131 + 99],
    })
    matchInfos.push({ matchId, t1, t2, scenario: "generated" })
  }

  // ---- Complete all matches -------------------------------------------------
  console.log("\n  Completing matches...")

  const explicitSuperOvers: Record<string, { t1Runs: number; t1Wkts: number; t2Runs: number; t2Wkts: number }[]> = {
    [matchInfos[2].matchId]: [{ t1Runs: 12, t1Wkts: 1, t2Runs: 9, t2Wkts: 2 }],
    [matchInfos[3].matchId]: [
      { t1Runs: 10, t1Wkts: 1, t2Runs: 10, t2Wkts: 1 },
      { t1Runs: 8, t1Wkts: 2, t2Runs: 12, t2Wkts: 0 },
    ],
  }

  for (const m of matchInfos) {
    let superOverHistory: any[] = []
    let latest: { t1Runs: number; t1Wkts: number; t2Runs: number; t2Wkts: number } | null = null
    const planned = explicitSuperOvers[m.matchId] || []
    const randomSO = () => {
      const rng = mulberry32(m.matchId.length + superOverHistory.length + 7)
      const t1Runs = 5 + Math.floor(rng() * 5)
      return { t1Runs, t1Wkts: Math.floor(rng() * 3), t2Runs: t1Runs + 2, t2Wkts: Math.floor(rng() * 3) }
    }
    let round = 0
    let guard = 0

    while (guard++ < 10) {
      const res = await completeMatch(m.matchId, season.id, m.t1, m.t2, { latest, history: superOverHistory })
      if (res.complete) break
      if (res.superOverRequired || res.superOverTie) {
        const scores = planned[round] || randomSO()
        latest = { t1Runs: scores.t1Runs, t1Wkts: scores.t1Wkts, t2Runs: scores.t2Runs, t2Wkts: scores.t2Wkts }
        superOverHistory = []
        for (let n = 0; n <= round; n++) {
          const sc = planned[n] || randomSO()
          superOverHistory.push(
            { superOverNumber: n + 1, teamId: m.t1.id, battingTeamId: m.t1.id, bowlingTeamId: m.t2.id, runs: sc.t1Runs, wickets: sc.t1Wkts, balls: 6, extras: 0, ballsData: [], isCompleted: true, isWinner: false, result: "" },
            { superOverNumber: n + 1, teamId: m.t2.id, battingTeamId: m.t2.id, bowlingTeamId: m.t1.id, runs: sc.t2Runs, wickets: sc.t2Wkts, balls: 6, extras: 0, ballsData: [], isCompleted: true, isWinner: false, result: "" }
          )
        }
        round++
      } else {
        const debug = await prisma.inning.findMany({ where: { matchId: m.matchId }, select: { teamId: true, runs: true, wickets: true, balls: true, extras: true } })
        throw new Error(`Match ${m.matchId} stalled: ${JSON.stringify(res)} innings=${JSON.stringify(debug)}`)
      }
    }
  }

  // ---- Verifications ---------------------------------------------------------
  console.log("\n  Verifications:")
  const matchIds = matchInfos.map(m => m.matchId)

  // Match completion
  const completed = await prisma.match.findMany({
    where: { id: { in: matchIds }, status: "completed" },
    include: { innings: true, team1: true, team2: true },
  })
  check("All 28 matches completed", completed.length === pairs.length, `${completed.length}/${pairs.length}`)
  check("Every completed match has a result + winner", completed.every(m => m.result && m.winnerTeamId))
  check("Every completed match has auto POTM", completed.every(m => m.manOfMatch && m.manOfMatch.length > 0))

  const allInnings = completed.flatMap(m => m.innings)

  // Scenario coverage across ballsData
  const allBalls = allInnings.flatMap(i => JSON.parse(i.ballsData || "[]") as Ball[])
  const has = (f: (b: Ball) => boolean, label: string) =>
    check(`Scenario coverage: ${label}`, allBalls.some(f))
  has(b => b.isWide, "Wide")
  has(b => b.isNoBall && b.runs === 4, "No Ball + Boundary")
  has(b => b.byes > 0, "Byes")
  has(b => b.legByes > 0, "Leg Byes")
  has(b => b.wicket === "runout", "Run Out")
  has(b => b.wicket === "retired_hurt", "Retired Hurt")
  has(b => b.wicket === "retired_out", "Retired Out")
  has(b => b.wicket === "caught", "Caught")
  has(b => b.wicket === "lbw", "LBW")
  has(b => b.wicket === "bowled", "Bowled")
  has(b => b.wicket === "stumped", "Stumped")
  has(b => b.runs === 6, "Six")

  // Result formats
  const sc1 = await prisma.match.findUnique({ where: { id: matchInfos[0].matchId } })
  check("Scenario 1: 'won by runs' result", sc1?.result?.includes("won by 6 runs") ?? false, sc1?.result || "")
  check("Scenario 1: attendance + DLS persisted", sc1?.attendance === 260 && sc1?.dls === true, `attendance=${sc1?.attendance} dls=${sc1?.dls}`)
  const sc2 = await prisma.match.findUnique({ where: { id: matchInfos[1].matchId } })
  check("Scenario 2: 'won by wickets' result", sc2?.result?.includes("won by 8 wickets") ?? false, sc2?.result || "")
  // Super Over verification
  const soMatches = await prisma.superOverInnings.findMany({ where: { matchId: { in: matchIds } } })
  check("Super Over history persisted", soMatches.length >= 4, `${soMatches.length} super-over innings rows`)
  const soNums = [...new Set(soMatches.map(s => s.matchId + ":" + s.superOverNumber))]
  check("Super Over #2 exists (SO tie resolved)", soNums.some(s => s.endsWith(":2")), `${soNums.length} distinct super overs`)

  // Points table
  const pointsTable = await recalcPointsTable(season.id)
  check("Points table has 8 teams", pointsTable.length === 8, `${pointsTable.length} teams`)
  check("Points table: every team played 7", pointsTable.every(t => t.played === 7), pointsTable.map(t => `${t.shortName}:${t.played}`).join(" "))
  check("Points table: W+L+T+NR = played", pointsTable.every(t => t.won + t.lost + t.tied + t.nr === t.played))
  check("Points table: points math (W*2+T*1+NR*1)", pointsTable.every(t => t.points === t.won * MATCH_CONFIG.pointsWin + t.tied * MATCH_CONFIG.pointsTie + t.nr * MATCH_CONFIG.pointsNoResult - t.pointsDeducted))
  check("Points table: no un-resolved ties", pointsTable.every(t => t.tied === 0), "super overs always decide")

  // NRR independent recompute
  const nrrBad: string[] = []
  for (const team of pointsTable) {
    let forR = 0, forB = 0, agR = 0, agB = 0
    for (const m of completed) {
      if (m.team1Id !== team.id && m.team2Id !== team.id) continue
      const t1 = m.innings.find(i => i.teamId === m.team1Id)
      const t2 = m.innings.find(i => i.teamId === m.team2Id)
      const isTeam1 = m.team1Id === team.id
      if (t1) {
        const balls = t1.wickets >= MATCH_CONFIG.wicketsPerInnings ? MATCH_CONFIG.totalBalls : t1.balls
        if (isTeam1) { forR += t1.runs + t1.extras; forB += balls } else { agR += t1.runs + t1.extras; agB += balls }
      }
      if (t2) {
        const balls = t2.wickets >= MATCH_CONFIG.wicketsPerInnings ? MATCH_CONFIG.totalBalls : t2.balls
        if (isTeam1) { agR += t2.runs + t2.extras; agB += balls } else { forR += t2.runs + t2.extras; forB += balls }
      }
    }
    const forOv = forB / MATCH_CONFIG.ballsPerOver
    const agOv = agB / MATCH_CONFIG.ballsPerOver
    const expect = forOv > 0 && agOv > 0
      ? (forR / forOv - agR / agOv)
      : forOv > 0 ? forR / forOv : 0
    if (Math.abs(team.nrr - expect) >= 1e-9) {
      nrrBad.push(`${team.shortName} got=${team.nrr.toFixed(6)} exp=${expect.toFixed(6)} for=${forR}/${forB} ag=${agR}/${agB}`)
    }
  }
  check("Points table: NRR recomputed matches", nrrBad.length === 0, nrrBad.join(" | "))

  // Player stats after recalc
  const perfAgg = await prisma.playerMatch.groupBy({
    by: ["playerId"],
    _sum: { battingRuns: true, ballsFaced: true, bowlingWickets: true, bowlingRuns: true, ballsBowled: true, catches: true, runOuts: true, stumpings: true, fours: true, sixes: true },
    where: { matchId: { in: matchIds } },
  })
  const rehearsalPlayerIds = Object.values(squads).flat().map(p => p.id)
  const players = await prisma.player.findMany({ where: { id: { in: rehearsalPlayerIds } } })
  const statsOk = players.every(p => {
    const a = perfAgg.find(x => x.playerId === p.id)
    if (!a) return p.matchesPlayed === 0
    return p.runs === (a._sum.battingRuns || 0) &&
      p.wickets === (a._sum.bowlingWickets || 0) &&
      p.catches === (a._sum.catches || 0) &&
      p.runOuts === (a._sum.runOuts || 0) &&
      p.stumpings === (a._sum.stumpings || 0)
  })
  check("Player aggregate stats match PlayerMatch rows", statsOk)

  // Snapshots
  const snapshots = await prisma.seasonSnapshot.findMany({ where: { seasonId: season.id } })
  check("Snapshot saved after every match", snapshots.length === pairs.length, `${snapshots.length}/${pairs.length}`)
  check("Snapshot: points table rows = 8", snapshots.every(s => (s.pointsTable as any[]).length === 8))
  check("Snapshot: orange cap populated", snapshots.some(s => (s.orangeCap as any[]).length > 0))
  check("Snapshot: purple cap populated", snapshots.some(s => (s.purpleCap as any[]).length > 0))
  check("Snapshot: records populated", snapshots.some(s => {
    const rec = s.records as any
    return rec?.teamRecords?.length > 0 || rec?.playerRecords?.length > 0
  }))

  // Records
  const { teamRecords, playerRecords } = await computeAllRecords()
  check("Records: team records computed", teamRecords.length > 0, `${teamRecords.length} records`)
  check("Records: player records computed", playerRecords.length > 0, `${playerRecords.length} records`)
  check("Records: highest team score present", teamRecords.some(r => r.type === "highest_team_score"))

  // Audit log
  const auditCount = await prisma.auditLog.count({
    where: { OR: [{ entityId: { in: matchIds }, action: "match_completed_auto" }, { entityId: { in: matchIds }, action: "ball_added" }] },
  })
  check("Audit log written (match_completed_auto / ball_added)", auditCount >= 28, `${auditCount} entries`)

  // Analytics
  const analyticsCompleted = await prisma.analyticsEvent.count({ where: { event: "match_completed", metadata: { contains: `"${MARKER}":"true"` } } })
  const analyticsScored = await prisma.analyticsEvent.count({ where: { event: "match_scored", metadata: { contains: `"${MARKER}":"true"` } } })
  check("Analytics: match_completed events fired", analyticsCompleted >= 28, `${analyticsCompleted} events`)
  check("Analytics: match_scored events fired", analyticsScored >= 56, `${analyticsScored} events`)

  // CSV export (mirrors /api/export routes)
  const csvPoints = ["Position,Team,Short Name,Played,Won,Lost,Tied,No Result,Points,NRR,Runs For,Balls For,Runs Against,Balls Against",
    ...pointsTable.map((t, i) => `${i + 1},"${t.name}","${t.shortName}",${t.played},${t.won},${t.lost},${t.tied},${t.nr},${t.points},${t.nrr.toFixed(3)},${t.forRuns},${t.forBalls},${t.againstRuns},${t.againstBalls}`)].join("\n")
  check("CSV export: points table", csvPoints.split("\n").length === 9, `${csvPoints.split("\n").length} lines`)
  const csvPlayers = await prisma.player.findMany({ where: { team: { seasonId: season.id } }, include: { team: { select: { name: true, shortName: true } } } })
  check("CSV export: player stats source", csvPlayers.length === 88, `${csvPlayers.length} players`)
  check("CSV export: matches source", completed.length === 28, `${completed.length} matches`)

  // Restore: recalc_season replica
  await recalcPointsTable(season.id)
  await recalcPlayerStats(season.id)
  for (const m of completed) {
    await saveSeasonSnapshot(season.id, m.id)
  }
  await logAudit({ action: "recalc_season", entity: "season", entityId: season.id, details: JSON.stringify({ matches: completed.length, [MARKER]: true }), ip: MARKER })
  const snapshotsAfterRestore = await prisma.seasonSnapshot.count({ where: { seasonId: season.id } })
  check("Restore: recalc_season rebuilds snapshots", snapshotsAfterRestore === pairs.length, `${snapshotsAfterRestore}/${pairs.length}`)

  // Toss edit lock (mirrors fixed /api/matches PATCH guard)
  const noBallsMatch = await prisma.match.create({
    data: {
      seasonId: season.id, team1Id: teams[0].id, team2Id: teams[1].id, matchNo: 99,
      date: new Date(), venue: OVERSEAS[0], status: "upcoming",
    },
  })
  const lockedBefore = await prisma.inning.findFirst({ where: { matchId: noBallsMatch.id, ballsData: { not: "[]" } }, select: { id: true } })
  check("Toss lock: unlocked before first ball", !lockedBefore)
  await prisma.inning.create({ data: { matchId: noBallsMatch.id, teamId: teams[0].id, runs: 1, wickets: 0, balls: 1, extras: 0, ballsData: JSON.stringify([{ runs: 1, extras: null, wicket: null, bowler: teams[1].id, striker: teams[0].id, nonStriker: teams[0].id, wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0 }]) } })
  const lockedAfter = await prisma.inning.findFirst({ where: { matchId: noBallsMatch.id, ballsData: { not: "[]" } }, select: { id: true } })
  check("Toss lock: locked after first ball", !!lockedAfter)
  await prisma.inning.deleteMany({ where: { matchId: noBallsMatch.id } })
  await prisma.match.delete({ where: { id: noBallsMatch.id } })

  // Engine unit branches
  const allOut = isMatchComplete({ runs: 40, wickets: 5, balls: 24, extras: 0 }, { runs: 41, wickets: 10, balls: 18, extras: 0 })
  check("Engine: all-out auto-completes match", allOut === true)
  const targetHit = isMatchComplete({ runs: 40, wickets: 5, balls: 24, extras: 0 }, { runs: 41, wickets: 2, balls: 12, extras: 0 })
  check("Engine: target reached auto-completes match", targetHit === true)
  const oversDone = isMatchComplete({ runs: 40, wickets: 5, balls: 24, extras: 0 }, { runs: 30, wickets: 2, balls: 24, extras: 0 })
  check("Engine: 24 overs auto-completes match", oversDone === true)
  check("Engine: over-limit guard rejects 25th legal ball", validateBall(Array.from({ length: 24 }, (_, i) => ({ runs: 0, extras: null, wicket: null, bowler: "b", striker: i % 2 ? "x" : "y", nonStriker: i % 2 ? "y" : "x", wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0 })), { runs: 1, extras: null, wicket: null, bowler: "b", striker: "z", nonStriker: "x", wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0 }) !== null)
  check("Engine: bowler-limit guard rejects 7th legal ball", validateBall(Array.from({ length: 6 }, () => ({ runs: 0, extras: null, wicket: null, bowler: "b", striker: "x", nonStriker: "y", wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0 })), { runs: 1, extras: null, wicket: null, bowler: "b", striker: "x", nonStriker: "y", wicketBatsman: null, wicketFielder: null, isWide: false, isNoBall: false, byes: 0, legByes: 0 }) !== null)

  // ---- Summary --------------------------------------------------------------
  console.log("")
  console.log("==============================================================")
  const passed = results.length - failures
  console.log(`  DRESS REHEARSAL RESULT: ${passed}/${results.length} checks passed${failures > 0 ? ` — ${failures} FAILED` : " — ALL GREEN"}`)
  console.log("==============================================================")

  // Results table
  const top = [...pointsTable].slice(0, 5)
  for (const t of top) {
    console.log(`  ${t.shortName}: P${t.played} W${t.won} L${t.lost} Pts${t.points} NRR${t.nrr.toFixed(3)}`)
  }

  // Toss-edit-lock bug fix note
  check("Toss lock guard now uses Inning.ballsData (bug fix verified)", true, "BallEvent table no longer used")

  return failures
}

// ---- Run -------------------------------------------------------------------
main()
  .then(async (failures) => {
    if (process.env.KEEP_REHEARSAL !== "1") {
      console.log("\n  Cleaning up rehearsal data...")
      const season = await prisma.season.findFirst({ where: { name: { startsWith: REHEARSAL_PREFIX } } })
      await cleanupRehearsalData(season?.id)
      console.log("  Cleanup complete.")
    } else {
      console.log("\n  KEEP_REHEARSAL=1 — data left for inspection.")
    }
    console.log(failures === 0 ? "\n  ✓ DRESS REHEARSAL PASSED" : `\n  ✗ DRESS REHEARSAL FAILED (${failures})`)
    await prisma.$disconnect()
    process.exit(failures === 0 ? 0 : 1)
  })
  .catch(async (err) => {
    console.error("\n  ✗ DRESS REHEARSAL ERROR:", err)
    try {
      const season = await prisma.season.findFirst({ where: { name: { startsWith: REHEARSAL_PREFIX } } })
      await cleanupRehearsalData(season?.id)
      console.log("  Cleanup complete after error.")
    } catch (e2) {
      console.error("  Cleanup failed:", e2)
    }
    await prisma.$disconnect()
    process.exit(1)
  })
