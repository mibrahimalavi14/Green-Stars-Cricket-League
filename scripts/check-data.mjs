import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const teams = await p.team.findMany({ include: { season: true } })
const matches = await p.match.findMany({ orderBy: { date: 'asc' }, take: 5 })
const season = await p.season.findFirst({ where: { isActive: true } })
console.log('Season:', JSON.stringify(season ? { id: season.id, name: season.name, year: season.year } : null))
console.log('Teams:', JSON.stringify(teams.map(t => ({ id: t.id, name: t.name, shortName: t.shortName }))))
console.log('Matches:', JSON.stringify(matches.map(m => ({ id: m.id, matchNo: m.matchNo, date: m.date, venue: m.venue, status: m.status }))))
await p.$disconnect()
