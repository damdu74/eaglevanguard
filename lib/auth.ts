import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      id: "steam-credentials",
      name: "Steam",
      credentials: { code: { type: "text" } },
      async authorize(credentials) {
        if (!credentials?.code) return null

        const authCode = await prisma.steamAuthCode.findUnique({
          where: { code: credentials.code },
          include: { user: true },
        })

        if (!authCode || authCode.expiresAt < new Date()) {
          if (authCode) await prisma.steamAuthCode.delete({ where: { code: credentials.code } }).catch(() => {})
          return null
        }

        await prisma.steamAuthCode.delete({ where: { code: credentials.code } }).catch(() => {})

        const u = authCode.user
        return {
          id: u.id,
          name: u.steamName ?? u.name,
          email: u.email,
          image: u.steamAvatar ?? u.image,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub } })
          if (dbUser) {
            session.user.name = dbUser.steamName ?? dbUser.discordName ?? dbUser.name ?? session.user.name
            session.user.image = dbUser.customAvatar ?? dbUser.steamAvatar ?? dbUser.discordAvatar ?? dbUser.image ?? session.user.image
          }
        } catch {}
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
