import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

import GitHub from "next-auth/providers/github"
import TelegramProvider from '@/providers/telegramProvider'


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/login',
    error: '/error',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (user) {
        session.user.id = (token.id as string).toString()
        session.user.name = token.name
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.name
      }
      return token
    },
  },
  secret: process.env.AUTH_SECRET,
  experimental: { enableWebAuthn: true },
})
