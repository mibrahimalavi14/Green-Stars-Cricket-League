import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MATCH_CONFIG } from "@/lib/config"

export const dynamic = "force-dynamic"

export async function GET() {
  let database = "disconnected"
  try {
    await prisma.$queryRaw`SELECT 1`
    database = "connected"
  } catch {
    database = "error"
  }

  return NextResponse.json({
    status: database === "connected" ? "ok" : "degraded",
    database,
    version: "v1.3.33",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "03a5856",
    config: {
      oversPerInnings: MATCH_CONFIG.oversPerInnings,
      totalBalls: MATCH_CONFIG.totalBalls,
      wicketsPerInnings: MATCH_CONFIG.wicketsPerInnings,
    },
    timestamp: new Date().toISOString(),
  })
}
