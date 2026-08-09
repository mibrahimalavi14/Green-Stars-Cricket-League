import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET(req: Request) {
  const session = getSession(req)
  return NextResponse.json({ user: session ? { name: session.name, email: session.email } : null })
}
