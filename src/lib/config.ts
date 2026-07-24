export const MATCH_CONFIG = {
  oversPerInnings: 4,
  ballsPerOver: 6,
  totalBalls: 24,
  wicketsPerInnings: 10,
  maxOversPerBowler: 1,
  maxBallsPerBowler: 6,
  pointsWin: 2,
  pointsTie: 1,
  pointsNoResult: 1,
} as const

export function formatOvers(balls: number): string {
  return `${Math.floor(balls / MATCH_CONFIG.ballsPerOver)}.${balls % MATCH_CONFIG.ballsPerOver}`
}
