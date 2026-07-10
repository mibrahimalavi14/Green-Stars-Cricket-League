import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const p1 = await prisma.player.updateMany({
    where: { name: "Abdulrehman Farhan" },
    data: { photo: "/images/players/Abdulrehman Farhan.png" },
  })
  const p2 = await prisma.player.updateMany({
    where: { name: "Muhammad Dawood" },
    data: { photo: "/images/players/Muhammad Dawood.png" },
  })
  console.log(`Updated ${p1.count} Abdulrehman Farhan, ${p2.count} Muhammad Dawood`)
}
main().catch(console.error).finally(() => prisma.$disconnect())
