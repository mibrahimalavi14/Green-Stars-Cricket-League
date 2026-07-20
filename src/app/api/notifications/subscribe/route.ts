import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { endpoint, p256dh, auth, email } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, email: email || "" },
      create: { endpoint, p256dh, auth, email: email || "" },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}
