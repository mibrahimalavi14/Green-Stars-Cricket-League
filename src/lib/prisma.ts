import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  if (process.env.NODE_ENV === "production") {
    const url = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
    const adapter = new PrismaNeon(
      {
        connectionString: url,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        max: 10,
      },
      {
        onPoolError: (err) => console.error("[db] pool error:", err.message),
        onConnectionError: (err) => console.error("[db] connection error:", err.message),
      }
    )
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
