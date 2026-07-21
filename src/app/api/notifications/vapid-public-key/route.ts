import { NextResponse } from "next/server"
import { vapidKeys } from "../vapid"

export async function GET() {
  return NextResponse.json({ publicKey: vapidKeys.publicKey })
}
