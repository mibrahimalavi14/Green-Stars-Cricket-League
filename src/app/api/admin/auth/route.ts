import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const body = await req.json()
  const { password } = body

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set("admin_auth", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/admin",
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_auth")
  return NextResponse.json({ success: true })
}
