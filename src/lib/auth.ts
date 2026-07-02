import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/predictions",
    error: "/predictions",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return true
      }
      return false
    },
    session({ session, user }) {
      if (session.user) session.user.id = user.id
      return session
    },
  },
  logger: {
    error(error) {
      console.error("NextAuth Error:", error?.message || error, error?.stack || "")
    },
  },
})
