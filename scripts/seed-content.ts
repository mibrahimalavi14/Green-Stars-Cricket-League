import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CHAIRMAN_MESSAGE =
  "Assalam-o-Alaikum, cricket fans.\n\nWhen I look at the young cricketers of Haripur, I see the future of Pakistan cricket. Green Stars Cricket League was born from a simple belief — that every talented young player, no matter where they come from, deserves a fair chance to shine.\n\nThe energy, the passion and the discipline you bring to every match fills me with pride. This league is not just about winning matches or lifting trophies; it is about building character, learning teamwork, and chasing dreams with heart. Every run you score and every wicket you take writes a new chapter in the story of GSCL.\n\nI want to thank every player, coach, official, sponsor and supporter who makes this dream possible. This is your league, and together we will take it to new heights.\n\nMay Allah bless our league and our community. Let us keep playing with passion, sportsmanship and respect."

async function main() {
  await prisma.chairmanMessage.upsert({
    where: { id: "chairman-message-main" },
    update: {},
    create: {
      id: "chairman-message-main",
      name: "Hafiz Muhammad Ibrahim Alavi",
      title: "Chairman, Green Stars Cricket League",
      message: CHAIRMAN_MESSAGE,
      photo: "/images/management/Chairman Muhammad Ibrahim Alavi.png",
      showSignature: true,
      active: true,
    },
  })

  await prisma.managementMember.upsert({
    where: { id: "management-chairman" },
    update: {},
    create: {
      id: "management-chairman",
      name: "Muhammad Ibrahim Alavi",
      role: "Chairman",
      photo: "/images/management/Chairman Muhammad Ibrahim Alavi.png",
      quote:
        "GSCL is not just a league — it is a platform for the youth of Haripur to showcase their talent and pursue their dreams.",
      sortOrder: 0,
      active: true,
    },
  })

  console.log("Content seeded: ChairmanMessage + ManagementMember")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
