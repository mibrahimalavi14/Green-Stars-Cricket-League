import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const season = await p.season.findFirst({ where: { name: "Season 1" } })
if (!season) { console.log("Season 1 not found"); process.exit(1) }

// 1. Fix team logos
const teamLogos = {
  "Alpha Warriors": "/images/teams/Alpha-Warriors.jpg",
  "Dragon Knights": "/images/teams/Dragon-Knights.jpg",
  "Elite Rangers": "/images/teams/Elite-Rangers.jpg",
  "Falcon Strikers": "/images/teams/Falcon-Strikers.jpg",
  "Legends XI": "/images/teams/Legends-XI.jpg",
  "Power Panthers": "/images/teams/Power-Panthers.jpg",
  "Thunder Hawks": "/images/teams/Thunder-Hawks.jpg",
  "Green Gladiators": "/images/teams/green-gladiators.jpg",
}

const teams = await p.team.findMany({ where: { seasonId: season.id } })
for (const t of teams) {
  const logo = teamLogos[t.name]
  if (logo) {
    await p.team.update({ where: { id: t.id }, data: { logo } })
    console.log(`Logo: ${t.shortName} -> ${logo}`)
  }
}

// 2. Fix player photos
const playerPhotos = {
  "Ahmed Bhatti": "/images/players/Ahmed Bhatti.png",
  "Chaudhary Abdullah": "/images/players/Chaudhary Abdullah.png",
  "Abdulrehman Farhan": "/images/players/Abdulrehman Farhan.png",
  "Abubakar Saddique": "/images/players/Abubakar Saddique.png",
  "Malik Taha Qaiser": "/images/players/Malik Taha Qaiser.png",
  "Farhan Rasool": "/images/players/Farhan Rasool.jpg",
  "Ahmed Raza": "/images/players/Ahmed Raza.png",
  "Usman Bhatti": "/images/players/Usman Bhatti.png",
}

const players = await p.player.findMany({ where: { team: { seasonId: season.id } } })
for (const pl of players) {
  const photo = playerPhotos[pl.name]
  if (photo) {
    await p.player.update({ where: { id: pl.id }, data: { photo } })
    console.log(`Photo: ${pl.name} -> ${photo}`)
  } else {
    console.log(`No photo mapping for: ${pl.name}`)
  }
}

// 3. Add 4 playoff matches
// Get teams sorted by shortName to determine seeding
// Top 4 after league stage, but we don't know who yet
// We'll assign TBD teams for now
const tList = teams.sort((a, b) => a.shortName.localeCompare(b.shortName))

// Playoff dates (after Aug 16)
const playoffDates = [
  { label: "Qualifier 1", date: new Date("2026-08-23T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
  { label: "Eliminator", date: new Date("2026-08-23T12:00:00.000Z"), venue: "AWT Cricket Ground" },
  { label: "Qualifier 2", date: new Date("2026-08-30T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
  { label: "Final", date: new Date("2026-09-06T11:00:00.000Z"), venue: "Al-Kabir Cricket Road" },
]

let matchNo = 29
for (const pd of playoffDates) {
  await p.match.create({
    data: {
      seasonId: season.id,
      team1Id: tList[0].id,
      team2Id: tList[1].id,
      matchNo: matchNo++,
      date: pd.date,
      venue: pd.venue,
      status: "upcoming",
      result: "",
      team1Score: "TBD",
      team2Score: "TBD",
    }
  })
  console.log(`Playoff: ${pd.label} -> ${pd.date.toLocaleDateString("en-GB", { timeZone: "Asia/Karachi" })} ${pd.venue}`)
}

console.log("\nDone! All paths fixed and playoffs added.")
await p.$disconnect()
