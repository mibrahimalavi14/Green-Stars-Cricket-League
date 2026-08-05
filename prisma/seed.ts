import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  await prisma.workspace.upsert({
    where: { id: "official" },
    update: {},
    create: { id: "official", name: "Official Season", type: "OFFICIAL" },
  })
  await prisma.workspace.upsert({
    where: { id: "practice" },
    update: {},
    create: { id: "practice", name: "Practice Mode", type: "PRACTICE" },
  })

  const season = await prisma.season.create({
    data: { name: "Season 1", year: 2026, isActive: true, scheduleAnnounced: false, workspaceId: "official" },
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
