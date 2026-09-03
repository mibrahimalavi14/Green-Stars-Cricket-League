/**
 * Canonical per-ball scoring helpers.
 *
 * Single source of truth for how runs/extras/overs are attributed from a single
 * ball event. Used by the live-scoring API, stats aggregation, partnerships,
 * timeline, and display components so every path stays consistent.
 */

export interface BallEvent {
  id?: string
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
  /** Dead ball: a non-delivery. Does not advance the over or credit the bowler. */
  deadBall?: boolean
  /** Runs scored via an overthrow on this delivery (credited to the striker + team). */
  overthrows?: number
  /** Team penalty runs awarded on this ball (never credited to a batsman/bowler). */
  penaltyRuns?: number
}

/** A legal delivery that counts toward the over / wickets. Wides, no-balls and dead balls are not. */
export function isLegalDelivery(ball: BallEvent): boolean {
  return !ball.isWide && !ball.isNoBall && !ball.deadBall
}

/** Runs credited to the striker off this delivery (wides exclude; overthrows add on). */
export function ballBatRuns(ball: BallEvent): number {
  return (ball.isWide ? 0 : ball.runs) + (ball.overthrows || 0)
}

/** Runs added to the innings/team total from this ball (bat + overthrows + penalty). */
export function ballTeamRuns(ball: BallEvent): number {
  return ball.runs + (ball.overthrows || 0) + (ball.penaltyRuns || 0)
}

/** Runs conceded by the bowler off this delivery (penalty runs are never charged to the bowler). */
export function ballBowlingRuns(ball: BallEvent): number {
  return ball.runs + (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + (ball.overthrows || 0)
}

/** Extras component added to innings.extras (wide/no-ball penalty + byes + leg byes). */
export function ballExtras(ball: BallEvent): number {
  return (ball.isWide ? 1 : 0) + (ball.isNoBall ? 1 : 0) + (ball.byes || 0) + (ball.legByes || 0)
}
