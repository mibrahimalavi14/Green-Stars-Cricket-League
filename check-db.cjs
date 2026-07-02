const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma
  .$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table'")
  .then((r) => {
    console.log("Tables:", JSON.stringify(r));
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error("Error:", e.message);
    prisma.$disconnect();
  });
