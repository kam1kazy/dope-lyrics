import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

import TelegramProvider from '@/providers/telegramProvider'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    TelegramProvider({
      clientId: process.env.TELEGRAM_BOT_ID as string,
      clientSecret: process.env.TELEGRAM_BOT_SECRET as string,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
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
})
