import NextAuth from 'next-auth'

import GitHub from "next-auth/providers/github"
import Credentials from '@/app/api/auth/callback/[provider]/Credentials'
import UserService from '../../src/services/userServices';

const userService = new UserService(process.env.NEXT_PUBLIC_API_URL || '');


export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    createUser: (user) => userService.createUser(user),
    getUser: (id) => userService.getUser(id),
    getUserByEmail: (email) => userService.getUserByEmail(email),
    getUserByAccount: (account) => userService.getUserByAccount(account),
    updateUser: (user) => userService.updateUser(user),
    linkAccount: (account) => userService.linkAccount(account),
    createSession: (session) => userService.createSession(session),
    getSessionAndUser: (sessionToken) => userService.getSessionAndUser(sessionToken),
    updateSession: (session) => userService.updateSession(session),
    deleteSession: (sessionToken) => userService.deleteSession(sessionToken),
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
  providers: [
    Credentials,
  ],
  callbacks: {
    async session({ session, token }) {
      console.log("Session callback: ", { session, token });
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  experimental: { enableWebAuthn: true },
})
