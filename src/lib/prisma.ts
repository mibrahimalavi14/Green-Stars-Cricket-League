import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Use pooled URL in production for faster serverless connections
if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL_POOLED) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_POOLED
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
