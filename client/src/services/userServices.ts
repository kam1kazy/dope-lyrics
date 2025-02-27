import { IUser } from "@/types/user";

interface ICreateUser {
  id: string;
  name?: string | null | undefined;
  email: string;
}



class UserService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async createUser(user: ICreateUser) {
    console.log('Creating user:', user);
    const res = await fetch(`${this.apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                mutation CreateUser($name: String!, $email: String!) {
                  createUser(name: $name, email: $email) {
                    id
                    name
                    email
                  }
                }
              `,
        variables: { name: user.name, email: user.email },
      }),
    });
    const result = await res.json();
    console.log('Server response:', result);
    return result.data.createUser;
  }

  async getUser(id: string) {
    const res = await fetch(`${this.apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                query GetUser($id: ID!) {
                  user(id: $id) {
                    id
                    name
                    email
                  }
                }
              `,
        variables: { id },
      }),
    });
    const result = await res.json();
    return result.data.user || null;
  }

  async getUserByEmail(email: IUser['email']) {
    const res = await fetch(`${this.apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                query GetUserByEmail($email: String!) {
                  user(email: $email) {
                    id
                    name
                    email
                  }
                }
              `,
        variables: { email },
      }),
    });
    const result = await res.json();
    return result.data.user || null;
  }

  async getUserByAccount({ provider, providerAccountId }: { provider: string, providerAccountId: string }) {
    const res = await fetch(`${this.apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                query GetUserByAccount($provider: String!, $providerAccountId: String!) {
                  userByAccount(provider: $provider, providerAccountId: $providerAccountId) {
                    id
                    name
                    email
                  }
                }
              `,
        variables: { provider, providerAccountId },
      }),
    });
    const result = await res.json();
    return result.data.userByAccount || null;
  }

  async updateUser(user: any) {
    const res = await fetch(`${this.apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                mutation UpdateUser($id: ID!, $name: String, $email: String) {
                  updateUser(id: $id, name: $name, email: $email) {
                    id
                    name
                    email
                  }
                }
              `,
        variables: { id: user.id, name: user.name, email: user.email },
      }),
    });
    const result = await res.json();
    return result.data.updateUser;
  }

  async linkAccount(account: any) {
    const res = await fetch(`${this.apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                mutation LinkAccount($userId: ID!, $provider: String!, $providerAccountId: String!) {
                  linkAccount(userId: $userId, provider: $provider, providerAccountId: $providerAccountId) {
                    userId
                    provider
                    providerAccountId
                  }
                }
              `,
        variables: {
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      }),
    });
    const result = await res.json();
    return result.data.linkAccount;
  }

  async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
    console.log('Creating session in UserService:', session);
    const res = await fetch(`${this.apiUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
            mutation CreateSession($sessionToken: String!, $userId: ID!, $expires: String!) {
              createSession(sessionToken: $sessionToken, userId: $userId, expires: $expires) {
                sessionToken
                userId
                expires
              }
            }
          `,
        variables: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires.toISOString(),
        },
      }),
    });
    const result = await res.json();
    console.log('Session creation result:', result);
    if (!result.data?.createSession) {
      throw new Error('Ошибка создания сессии');
    }
    return result.data.createSession;
  }

  async getSessionAndUser(sessionToken: string) {
    const res = await fetch(`${this.apiUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query GetSession($sessionToken: String!) {
            session(sessionToken: $sessionToken) {
              sessionToken
              userId
              expires
              user {
                id
                name
                email
              }
            }
          }
        `,
        variables: { sessionToken },
      }),
    });
    const result = await res.json();
    const sessionData = result.data?.session;
    if (!sessionData) return null;
    return {
      session: {
        sessionToken: sessionData.sessionToken,
        userId: sessionData.userId.toString(),
        expires: new Date(sessionData.expires),
      },
      user: sessionData.user,
    };
  }

  async updateSession(session: { sessionToken: string; expires?: Date | undefined }) {
    const res = await fetch(`${this.apiUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation UpdateSession($sessionToken: String!, $expires: String!) {
            updateSession(sessionToken: $sessionToken, expires: $expires) {
              sessionToken
              userId
              expires
            }
          }
        `,
        variables: {
          sessionToken: session.sessionToken,
          expires: session.expires?.toISOString() || undefined,
        },
      }),
    });
    const result = await res.json();
    return result.data?.updateSession;
  }

  async deleteSession(sessionToken: string) {
    const res = await fetch(`${this.apiUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation DeleteSession($sessionToken: String!) {
            deleteSession(sessionToken: $sessionToken) {
              sessionToken
            }
          }
        `,
        variables: { sessionToken },
      }),
    });
    const result = await res.json();
    if (!result.data?.deleteSession) {
      console.warn('Ошибка удаления сессии');
    }
    return result.data?.deleteSession;
  }
}

export default UserService;