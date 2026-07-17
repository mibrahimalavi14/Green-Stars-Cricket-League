import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const season = await p.season.findFirst({ where: { name: "Season 1" } })
const matches = await p.match.findMany({ where: { seasonId: season.id }, orderBy: { matchNo: 'asc' }, include: { team1: true, team2: true } })

for (const m of matches) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  const label = m.matchNo >= 29 ? ["Q1","Elim","Q2","Final"][m.matchNo-29] : ""
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(8)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} | ${m.venue.padEnd(25)} ${label ? "("+label+")" : ""}`)
}

// Count per team
const teamMatches = {}
for (const m of matches) {
  if (m.matchNo > 28) continue
  for (const tid of [m.team1Id, m.team2Id]) {
    const t = tid === m.team1Id ? m.team1.shortName : m.team2.shortName
    teamMatches[t] = (teamMatches[t] || 0) + 1
  }
}
console.log("\n=== League matches per team ===")
for (const [t, c] of Object.entries(teamMatches)) {
  console.log(`${t}: ${c} matches`)
}

await p.$disconnect()
