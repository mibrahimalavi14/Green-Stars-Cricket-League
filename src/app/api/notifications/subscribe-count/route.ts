import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function deviceLabel(ua: string): string {
  if (!ua) return "Unknown device"
  let browser = "Browser"
  if (/edg\//i.test(ua)) browser = "Edge"
  else if (/chrome\//i.test(ua) || /crios\//i.test(ua)) browser = "Chrome"
  else if (/firefox\//i.test(ua)) browser = "Firefox"
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet"
  else if (/opr\//i.test(ua)) browser = "Opera"
  else if (/safari\//i.test(ua)) browser = "Safari"

  let os = "Other"
  if (/windows/i.test(ua)) os = "Windows"
  else if (/android/i.test(ua)) os = "Android"
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS"
  else if (/mac os/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua)) os = "Linux"

  const form = /mobi|android|iphone|ipad/i.test(ua) ? "Mobile" : "Desktop"
  return `${browser} · ${os} · ${form}`
}

export async function GET(req: Request) {
  try {
    const count = await prisma.pushSubscription.count()

    const cookie = req.headers.get("cookie") || ""
    const isAdmin = cookie.includes("admin_auth=true")

    if (!isAdmin) {
      return NextResponse.json({ count })
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      select: { id: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      count,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        device: deviceLabel(s.userAgent),
        createdAt: s.createdAt,
      })),
    })
  } catch {
    return NextResponse.json({ count: 0, subscriptions: [] })
  }
}
