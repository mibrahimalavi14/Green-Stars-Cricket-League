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

export function relativeDateLabel(date: Date, timeZone = "Asia/Karachi") {
  const now = new Date()
  const nowPKT = new Date(now.toLocaleString("en-US", { timeZone }))
  const datePKT = new Date(date.toLocaleString("en-US", { timeZone }))
  const today = nowPKT.toDateString()
  const target = datePKT.toDateString()
  if (target === today) return { label: "Today", className: "text-green-600 font-semibold" }
  const tomorrow = new Date(nowPKT)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (target === tomorrow.toDateString()) return { label: "Tomorrow", className: "text-amber-600 font-semibold" }
  const yesterday = new Date(nowPKT)
  yesterday.setDate(yesterday.getDate() - 1)
  if (target === yesterday.toDateString()) return { label: "Yesterday", className: "text-red-500 font-semibold" }
  return { label: "", className: "" }
}

const venueCoordinates: Record<string, string> = {
  "Al-Kabir Cricket Road": "31°21'08.4%22N+74°13'53.5%22E",
  "AWT Cricket Ground": "Plot+134+Block+B+AWT+Housing+Scheme+Phase+2+Lahore",
}

export function getVenueMapsUrl(venue: string): string | null {
  const coords = venueCoordinates[venue]
  if (coords) return `https://www.google.com/maps/search/${coords}`
  return null
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
