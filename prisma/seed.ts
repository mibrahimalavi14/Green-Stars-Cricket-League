import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const season = await prisma.season.create({
    data: { name: "Season 1", year: 2026, isActive: true, scheduleAnnounced: false },
  })

  console.log(`Created season: ${season.id}`)
  console.log("Database seeded! Ready to add teams and players via admin panel.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
