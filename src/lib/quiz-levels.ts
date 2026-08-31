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
