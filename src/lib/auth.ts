import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  debug: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "login" } },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return true
      }
      return false
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub
      return session
    },
  },
  logger: {
    error(error: Error) {
      const cause = (error as Error & { cause?: unknown })?.cause
      console.error(
        "NextAuth Error:",
        error?.message,
        error?.stack || "",
        cause instanceof Error ? `CAUSE: ${cause.message}\n${cause.stack}` : cause ? `CAUSE: ${JSON.stringify(cause)}` : ""
      )
    },
  },
})
