import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const matches = await p.match.findMany({ 
  orderBy: { date: 'asc' },
  include: { team1: true, team2: true }
})

for (const m of matches) {
  const pkDate = new Date(m.date)
  console.log(`M${m.matchNo} | ${pkDate.toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" })} ${pkDate.toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit", hour12: true })} | ${m.team1.shortName} vs ${m.team2.shortName} | ${m.venue}`)
}

await p.$disconnect()
