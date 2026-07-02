export function calculatePoints(teamStats: {
  won: number
  lost: number
  tied: number
  nr: number
}) {
  return teamStats.won * 2 + teamStats.tied * 1 + teamStats.nr * 1
}

export function calculateNRR(
  forRuns: number,
  forOvers: number,
  againstRuns: number,
  againstOvers: number
) {
  if (forOvers === 0 || againstOvers === 0) return 0
  return Number(
    (
      forRuns / forOvers -
      againstRuns / againstOvers
    ).toFixed(3)
  )
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
