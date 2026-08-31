/**
 * MATCH_CONFIG — Single source of truth for all league format rules.
 *
 * ⚠️  GSCL-specific rules (PSL-style):
 *   - Super Over: Used to break ties in ALL matches (league, knockout, final).
 *     Every tie is decided by Super Over — no match ends as a tie.
 *     If Super Over is also tied, another Super Over is played until a winner emerges.
 *   - Points: Win=2, Tie=1, No Result=1 (configurable).
 *   - Bowling limit: maxOversPerBowler per innings.
 *   - All-out NRR: ICC standard — uses totalBalls when all out, actual balls otherwise.
 *
 * Auto-completion triggers (match ends automatically when ANY of these occur):
 *   - All 4 overs (24 legal balls) completed
 *   - 10 wickets lost (all out)
 *   - Target achieved (2nd innings score > 1st innings total)
 *   Admin does NOT need to manually write result or select winner.
 *
 * Super Over rules (PSL-style, applies to ALL match stages):
 *   - Triggered automatically when both innings totals are equal
 *   - Each team gets 1 over (6 legal balls), max 2 wickets
 *   - Higher score wins the Super Over
 *   - If Super Over is tied → infinite Super Overs until winner
 *   - Winner team gets the win in points table
 *
 * MOTM (Man of the Match) — Automatic via Impact Score:
 *   Impact Score = Runs × 0.4 + Wickets × 8 + Catches × 5 + RunOuts × 5 + Stumpings × 5
 *   Tie-breakers: more wickets → more runs → better SR → lower economy → more catches
 *   Admin override ONLY if all tie-breakers are also equal.
 *
 * Two separate awards:
 *   - Official Man of the Match: Fully automatic via Impact Score
 *   - Fan Favourite Player: Public voting via POTM system
 *
 * Auto-completion cascade (after last ball):
 *   Match Complete → WinnerTeamId → Result Generate → Super Over (if tied)
 *   → Points Table → Player Stats → Team Stats → Awards → Records
 *   → Hall of Fame → Dream Team → MOTM (auto) → Analytics → Audit → Notification
 *
 * Result formatting:
 *   "Team A won by X runs"      — batting second wins; X = margin = (team1Total - team2Total)
 *   "Team A won by X wickets"   — batting first wins;  X = wicketsPerInnings - wicketsLost
 *   "Super Over: Team A won"    — tie decided by Super Over
 *   "No Result"                 — abandoned / incomplete
 *
 * Season qualification notes (for stat leaderboards):
 *   - Best Economy: minimum 6 overs across the season (not per match).
 *   - Best Strike Rate (batting): minimum 50 runs across the season.
 *   - Best Strike Rate (bowling): minimum 6 wickets across the season.
 */

const _config = {
  oversPerInnings: 4,
  ballsPerOver: 6,
  wicketsPerInnings: 10,
  maxOversPerBowler: 1,
  maxBallsPerBowler: 6,
  pointsWin: 2,
  pointsTie: 1,
  pointsNoResult: 1,
  superOverBalls: 6,
  superOverWickets: 2,
  motmRunsWeight: 0.4,
  motmWicketsWeight: 8,
  motmCatchesWeight: 5,
  motmRunOutsWeight: 5,
  motmStumpingsWeight: 5,
  fairPlayBasePoints: 100,
  fairPlayWarningDeduction: 5,
  fairPlayOverRateDeduction: 10,
  fairPlayBehaviorDeduction: 15,
  fairPlaySportsmanshipBonus: 2,
  challengeQuestionCount: 10,
  challengeTimeLimitSeconds: 10,
  challengeGraceSeconds: 5,
} as const

export const MATCH_CONFIG = {
  ..._config,
  totalBalls: _config.oversPerInnings * _config.ballsPerOver,
} as const

if (MATCH_CONFIG.ballsPerOver <= 0) throw new Error("MATCH_CONFIG: ballsPerOver must be > 0")
if (MATCH_CONFIG.maxOversPerBowler > MATCH_CONFIG.oversPerInnings) throw new Error("MATCH_CONFIG: maxOversPerBowler cannot exceed oversPerInnings")
if (MATCH_CONFIG.maxBallsPerBowler > MATCH_CONFIG.totalBalls) throw new Error("MATCH_CONFIG: maxBallsPerBowler cannot exceed totalBalls")
if (MATCH_CONFIG.pointsWin < 0 || MATCH_CONFIG.pointsTie < 0 || MATCH_CONFIG.pointsNoResult < 0) throw new Error("MATCH_CONFIG: points cannot be negative")

export function formatOvers(balls: number): string {
  return `${Math.floor(balls / MATCH_CONFIG.ballsPerOver)}.${balls % MATCH_CONFIG.ballsPerOver}`
}

export interface InningsState {
  runs: number
  wickets: number
  balls: number
  extras: number
}

export function isMatchComplete(innings1: InningsState, innings2: InningsState): boolean {
  if (!innings1 || !innings2) return false
  const t1Total = innings1.runs + innings1.extras
  const t2Total = innings2.runs + innings2.extras

  if (innings2.balls >= MATCH_CONFIG.totalBalls) return true
  if (innings2.wickets >= MATCH_CONFIG.wicketsPerInnings) return true
  if (t2Total > t1Total) return true

  return false
}

export function isSuperOverTie(innings1: InningsState, innings2: InningsState): boolean {
  if (!innings1 || !innings2) return false
  return (innings1.runs + innings1.extras) === (innings2.runs + innings2.extras)
}

export function calculateResult(
  innings1: InningsState,
  innings2: InningsState,
  team1Name: string,
  team2Name: string
): { result: string; winnerTeamId: string | null } {
  const t1Total = innings1.runs + innings1.extras
  const t2Total = innings2.runs + innings2.extras

  if (t1Total > t2Total) {
    const diff = t1Total - t2Total
    return {
      result: `${team1Name} won by ${diff} run${diff !== 1 ? "s" : ""}`,
      winnerTeamId: null, // caller fills in team IDs
    }
  } else if (t2Total > t1Total) {
    const wktsLeft = MATCH_CONFIG.wicketsPerInnings - innings2.wickets
    return {
      result: `${team2Name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}`,
      winnerTeamId: null,
    }
  }
  return { result: "Match Tied", winnerTeamId: null }
}

export function calculateMotm(playerStats: Array<{
  playerId: string
  battingRuns: number
  ballsFaced: number
  bowlingWickets: number
  catches: number
  runOuts: number
  stumpings: number
}>): string {
  if (playerStats.length === 0) return ""

  let bestId = ""
  let bestScore = -Infinity
  let bestWickets = -1
  let bestRuns = -1
  let bestSR = -1
  let bestEcon = Infinity
  let bestCatches = -1

  for (const p of playerStats) {
    const score =
      p.battingRuns * MATCH_CONFIG.motmRunsWeight +
      p.bowlingWickets * MATCH_CONFIG.motmWicketsWeight +
      p.catches * MATCH_CONFIG.motmCatchesWeight +
      p.runOuts * MATCH_CONFIG.motmRunOutsWeight +
      p.stumpings * MATCH_CONFIG.motmStumpingsWeight

    const sr = p.ballsFaced > 0 ? (p.battingRuns / p.ballsFaced) * 100 : 0

    let dominated = false
    if (score > bestScore) dominated = true
    else if (score === bestScore) {
      if (p.bowlingWickets > bestWickets) dominated = true
      else if (p.bowlingWickets === bestWickets && p.battingRuns > bestRuns) dominated = true
      else if (p.bowlingWickets === bestWickets && p.battingRuns === bestRuns && sr > bestSR) dominated = true
      else if (p.bowlingWickets === bestWickets && p.battingRuns === bestRuns && sr === bestSR && p.catches > bestCatches) dominated = true
    }

    if (dominated) {
      bestScore = score
      bestId = p.playerId
      bestWickets = p.bowlingWickets
      bestRuns = p.battingRuns
      bestSR = sr
      bestCatches = p.catches
    }
  }

  return bestId
}
