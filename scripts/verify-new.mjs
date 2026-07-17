import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const season = await p.season.findFirst({ where: { name: "Season 1" } })
const matches = await p.match.findMany({ where: { seasonId: season.id }, include: { team1: true, team2: true } })
const league = matches.filter(m => m.matchNo <= 28)
const playoffs = matches.filter(m => m.matchNo >= 29)
console.log(`Total: ${matches.length} (${league.length} league + ${playoffs.length} playoffs)`)

const counts = {}
for (const m of league) {
  for (const tid of [m.team1Id, m.team2Id]) {
    const sn = tid === m.team1Id ? m.team1.shortName : m.team2.shortName
    counts[sn] = (counts[sn] || 0) + 1
  }
}
for (const [t, c] of Object.entries(counts)) console.log(`  ${t}: ${c} matches`)
console.log(playoffs.map(m => `  M${m.matchNo}: ${["Q1","Elim","Q2","Final"][m.matchNo-29]} ${new Date(m.date).toLocaleDateString("en-GB",{timeZone:"Asia/Karachi"})}`).join("\n"))
await p.$disconnect()
