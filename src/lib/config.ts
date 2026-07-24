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
