import { IUser } from '~/types/user';

export const userSeedObject = (record: IUser) => {
  return {
    where: { email: record.email },
    create: {
      id: record.id,
      name: record.name,
      password: record.password,
      email: record.email,
      emailVerified: record.emailVerified,
      image: record.image,
      role: record.role,
      accounts: {
        create: record.accounts.map(account => ({
          userId: record.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at , // Ensure it's a Date
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        })),
      },
      sessions: {
        create: record.sessions.map(session => ({
          userId: record.id,
          sessionToken: session.sessionToken,
          refreshToken: session.refreshToken,
          expires: session.expires,
        })),
      },
    },
    update: {
      name: record.name,
      password: record.password,
      emailVerified: record.emailVerified,
      image: record.image,
      role: record.role,
    },
  };
};