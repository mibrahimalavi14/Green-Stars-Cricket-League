/**
 * MATCH_CONFIG — Single source of truth for all league format rules.
 *
 * ⚠️  GSCL-specific rules (not ICC standard):
 *   - Super Over: Used to break ties in playoffs only. League matches end as ties.
 *   - Points: Win=2, Tie=1, No Result=1 (configurable).
 *   - Bowling limit: maxOversPerBowler per innings.
 *   - All-out NRR: ICC standard — uses totalBalls when all out, actual balls otherwise.
 *
 * Season qualification notes (for stat leaderboards):
 *   - Best Economy: minimum 6 overs across the season (not per match).
 *   - Best Strike Rate (batting): minimum 50 runs across the season.
 *   - Best Strike Rate (bowling): minimum 6 wickets across the season.
 *
 * MOTM (Man of the Match) formula:
 *   Custom GSCL impact score (not an ICC standard metric):
 *     battingImpact  = runs × 1 + fours × 4 + sixes × 5 + notOutBonus - ducksPenalty - wicketsLost × 5
 *     bowlingImpact  = wickets × 25 + maidens × 12 + economyBonus - runsConceded × 0.5 - extrasPenalty
 *     fieldingImpact = catches × 12 + stumpings × 18 + runOuts × 20
 *     + allrounderBonus, 4wBonus, 5wBonus
 *   Final score = battingImpact + bowlingImpact + fieldingImpact + bonuses
 *
 * Result formatting:
 *   "Team A won by X runs"      — batting second wins; X = margin = (team1Total - team2Total)
 *   "Team A won by X wickets"   — batting first wins;  X = wicketsPerInnings - wicketsLost
 *   "Tied"                      — league match; "Super Over" in playoffs
 *   "No Result"                 — abandoned / incomplete
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
