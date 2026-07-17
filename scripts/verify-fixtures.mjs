import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const season = await p.season.findFirst({ where: { name: "Season 1", isActive: true } })
if (!season) { console.log("Season not found"); process.exit(1) }

const matches = await p.match.findMany({
  where: { seasonId: season.id, status: "upcoming" },
  orderBy: { matchNo: 'asc' },
  include: { team1: true, team2: true }
})

console.log(`Total upcoming matches: ${matches.length}\n`)

// Group by team
const teamMap = new Map()
for (const m of matches) {
  for (const t of [m.team1, m.team2]) {
    if (!teamMap.has(t.shortName)) teamMap.set(t.shortName, [])
    const opp = t.id === m.team1Id ? m.team2.shortName : m.team1.shortName
    teamMap.get(t.shortName).push(`M${m.matchNo}(${opp})`)
  }
}

for (const [team, opps] of teamMap) {
  console.log(`${team}: ${opps.length} matches — ${opps.join(', ')}`)
}

// Check for duplicates
const seen = new Set()
let dupes = 0
for (const m of matches) {
  const key = [m.team1Id, m.team2Id].sort().join('-')
  if (seen.has(key)) { console.log(`DUPLICATE: ${m.team1.shortName} vs ${m.team2.shortName} (M${m.matchNo})`); dupes++ }
  seen.add(key)
}
if (dupes === 0) console.log("\nNo duplicates found ✓")
else console.log(`\n${dupes} duplicates found ✗`)

const totalPairings = 8 * 7 / 2
console.log(`Expected: ${totalPairings} unique pairings`)
console.log(`Actual: ${seen.size} unique pairings`)

// Show full schedule
console.log("\n=== Full Schedule ===")
for (const m of matches) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(8)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} | ${m.venue}`)
}

await p.$disconnect()
