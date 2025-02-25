import { IUser } from '~/types/user'

export const userSeedObject = (record: IUser) => {
  return {
    where: { email: record.email }, // Используем email как уникальный ключ
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
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        })),
      },
      sessions: {
        create: record.sessions.map(session => ({
          sessionToken: session.sessionToken,
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
  }
}
