import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import webpush from "web-push"
import { vapidKeys } from "../vapid"

webpush.setVapidDetails(
  "mailto:greenstarscricketleague@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get("x-admin-key")
    if (adminKey !== "gscl-admin-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, body, link } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
    }

    const subscriptions = await prisma.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0 })
    }

    const payload = JSON.stringify({ title, body, link: link || "/" })

    let sent = 0
    let failed = 0

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
          sent++
        } catch (err: unknown) {
          failed++
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        }
      })
    )

    return NextResponse.json({ success: true, sent, failed: results.length - sent })
  } catch {
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
