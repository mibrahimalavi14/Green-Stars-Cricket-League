const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.match.findMany({ select: { id: true, tossWinner: true, tossDecision: true, team1Id: true, team2Id: true, status: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); p.$disconnect() })
