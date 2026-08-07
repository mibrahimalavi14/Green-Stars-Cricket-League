import { NextResponse } from "next/server"
import { sendPushNotification } from "@/lib/push"

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || ""
    if (!cookie.includes("admin_auth=true")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, body, link } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 })
    }

    const result = await sendPushNotification({ title, body, link: link || "/" })

    return NextResponse.json({ success: true, sent: result.sent, failed: result.failed })
  } catch {
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
