import NextAuth from 'next-auth';
import Credentials from '@/app/api/auth/callback/[provider]/Credentials';
import UserService from '../../src/services/userServices';

const userService = new UserService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql');

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
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials,
  ],
  callbacks: {
    // async jwt({ token, user, trigger }) {
    //   if (user) {
    //     token.id = user.id;
    //     token.email = user.email;
    //     token.name = user.name;
    //     const sessionToken = crypto.randomUUID();
    //     const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    //     await userService.createSession({ sessionToken, userId: user.id.toString(), expires });
    //     token.sessionToken = sessionToken;
    //   }
    //   if (trigger === 'signout') {
    //     if (token.sessionToken) {
    //       await userService.deleteSession(token.sessionToken as string);
    //     }
    //   }
    //   return token;
    // },
    async jwt({ token, user, trigger }) {
      console.log('JWT callback:', { token, user, trigger });
      if (user) {
        // После входа создаем запись в базе
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        const sessionToken = crypto.randomUUID();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        await userService.createSession({
          sessionToken,
          userId: user.id as string,
          expires,
        });
        token.sessionToken = sessionToken; // Сохраняем sessionToken в JWT
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.sessionToken = token.sessionToken as string; // Добавляем sessionToken в сессию
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  experimental: { enableWebAuthn: true },
});