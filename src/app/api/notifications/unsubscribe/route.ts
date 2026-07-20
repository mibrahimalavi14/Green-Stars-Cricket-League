import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint is required" }, { status: 400 })
    }

    await prisma.pushSubscription.delete({ where: { endpoint } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 })
  }
}
