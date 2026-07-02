import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    authUrl: process.env.AUTH_URL || "not set",
    nextAuthUrl: process.env.NEXTAUTH_URL || "not set",
    authSecret: process.env.AUTH_SECRET ? "set (" + process.env.AUTH_SECRET.length + " chars)" : "not set",
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? "set (" + process.env.NEXTAUTH_SECRET.length + " chars)" : "not set",
    googleId: process.env.AUTH_GOOGLE_ID ? "set (" + process.env.AUTH_GOOGLE_ID.length + " chars)" : "not set",
    googleSecret: process.env.AUTH_GOOGLE_SECRET ? "set (" + process.env.AUTH_GOOGLE_SECRET.length + " chars)" : "not set",
    databaseUrl: process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.substring(0, 20) + "...)" : "not set",
  })
}
