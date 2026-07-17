import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const season = await p.season.findFirst({ where: { name: "Season 2" } })
if (!season) { console.log("Season 2 not found"); process.exit() }

const teams = await p.team.findMany({ where: { seasonId: season.id }, include: { players: true } })
console.log("=== TEAMS ===")
for (const t of teams) {
  const players = t.players.map(p => `${p.name}${p.role === "All-rounder" ? " (AR)" : p.role === "Bowler" ? " (BOWL)" : " (BAT)"}`).join(", ")
  console.log(`${t.shortName.padEnd(5)} | ${t.name.padEnd(20)} | ${players}`)
}

const matches = await p.match.findMany({ where: { seasonId: season.id }, orderBy: { matchNo: 'asc' }, include: { team1: true, team2: true } })
console.log(`\n=== MATCHES (${matches.length}) ===`)
for (const m of matches) {
  const d = new Date(m.date).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })
  const t = new Date(m.date).toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })
  console.log(`M${String(m.matchNo).padEnd(2)} | ${d.padEnd(8)} ${t.padEnd(10)} | ${m.team1.shortName.padEnd(5)} vs ${m.team2.shortName.padEnd(5)} | ${m.venue}`)
}

await p.$disconnect()
