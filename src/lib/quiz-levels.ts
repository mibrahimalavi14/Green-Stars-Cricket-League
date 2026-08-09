export interface QuizLevel {
  level: number
  title: string
  icon: string
  minPoints: number
  color: string
}

export const QUIZ_LEVELS: QuizLevel[] = [
  { level: 1, title: "Rookie", icon: "🥚", minPoints: 0, color: "text-[var(--muted-foreground)]" },
  { level: 2, title: "Club Player", icon: "🏏", minPoints: 50, color: "text-green-600" },
  { level: 3, title: "Striker", icon: "⚡", minPoints: 150, color: "text-sky-600" },
  { level: 4, title: "Finisher", icon: "🔥", minPoints: 300, color: "text-orange-600" },
  { level: 5, title: "All-Rounder", icon: "🎯", minPoints: 500, color: "text-violet-600" },
  { level: 6, title: "Star", icon: "⭐", minPoints: 800, color: "text-amber-500" },
  { level: 7, title: "Super Star", icon: "🏆", minPoints: 1200, color: "text-red-500" },
  { level: 8, title: "Legend", icon: "👑", minPoints: 1800, color: "text-yellow-500" },
]

export function getLevel(points: number) {
  let current = QUIZ_LEVELS[0]
  for (const l of QUIZ_LEVELS) {
    if (points >= l.minPoints) current = l
    else break
  }
  const next = QUIZ_LEVELS.find(l => l.level === current.level + 1) || null
  const progress = next
    ? Math.min(100, Math.round(((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100))
    : 100
  return { current, next, progress }
}

export interface BadgeDef {
  id: string
  title: string
  desc: string
  icon: string
}

export const QUIZ_BADGES: BadgeDef[] = [
  { id: "first_step", title: "First Step", desc: "Answer your first quiz question", icon: "👣" },
  { id: "sharp_shooter", title: "Sharp Shooter", desc: "5 correct answers", icon: "🎯" },
  { id: "quiz_master", title: "Quiz Master", desc: "10 correct answers", icon: "🏅" },
  { id: "daily_3", title: "On Fire", desc: "3-day daily challenge streak", icon: "🔥" },
  { id: "daily_7", title: "Unstoppable", desc: "7-day daily challenge streak", icon: "⚡" },
  { id: "season_perfect", title: "Perfect Score", desc: "Full marks on a season quiz", icon: "💯" },
  { id: "high_roller", title: "High Roller", desc: "Reach 500 total points", icon: "💰" },
  { id: "legend", title: "Legend", desc: "Reach Legend level", icon: "👑" },
]

const PKT_TZ = "Asia/Karachi"

export function pktToday() {
  const pkt = new Date(new Date().toLocaleString("en-US", { timeZone: PKT_TZ }))
  pkt.setHours(0, 0, 0, 0)
  return pkt
}

export function pktMonday() {
  const today = pktToday()
  const diff = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - diff)
  return monday
}

export function pktDateKey(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: PKT_TZ }))
}
