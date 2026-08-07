import webpush from "web-push"
import { prisma } from "@/lib/prisma"
import { vapidKeys } from "@/app/api/notifications/vapid"

webpush.setVapidDetails("mailto:greenstarscricketleague@gmail.com", vapidKeys.publicKey, vapidKeys.privateKey)

interface PushPayload {
  title: string
  body: string
  link?: string
}

export async function sendPushNotification({ title, body, link }: PushPayload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    })
    if (subscriptions.length === 0) return { sent: 0, failed: 0 }

    const payload = JSON.stringify({ title, body, link: link || "/" })

    let sent = 0
    const results = await Promise.allSettled(
      subscriptions.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          )
          sent++
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          }
        }
      }),
    )

    return { sent, failed: results.length - sent }
  } catch (err) {
    console.error("Push notification send error:", err)
    return { sent: 0, failed: 0 }
  }
}
