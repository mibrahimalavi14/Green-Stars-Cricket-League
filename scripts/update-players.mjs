import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const names = ["Usman Bhatti", "Ahmed Bhatti", "Abdulrehman Farhan"]
for (const name of names) {
  const player = await p.player.findFirst({ where: { name: { contains: name.split(" ")[0] } } })
  if (player) {
    console.log(`Found: ${player.id} | ${player.name} | Bat: ${player.battingStyle} | Bowl: ${player.bowlingStyle} | Team: ${player.teamId}`)
  } else {
    console.log(`Not found: ${name}`)
  }
}

// Now update
const updates = [
  { name: "Usman Bhatti", battingStyle: "Right-handed", bowlingStyle: "Right-arm fast" },
  { name: "Ahmed Bhatti", battingStyle: "Left-handed", bowlingStyle: "Right-arm fast" },
  { name: "Abdulrehman Farhan", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" },
]

for (const u of updates) {
  const player = await p.player.findFirst({ where: { name: { contains: u.name.split(" ")[0] } } })
  if (!player) {
    console.log(`Skipping: ${u.name}`)
    continue
  }
  await p.player.update({
    where: { id: player.id },
    data: { battingStyle: u.battingStyle, bowlingStyle: u.bowlingStyle },
  })
  console.log(`Updated: ${player.name} -> Bat: ${u.battingStyle}, Bowl: ${u.bowlingStyle}`)
}

await p.$disconnect()
console.log("Done!")
