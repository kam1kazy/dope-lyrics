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

    async createSession(session: any) {
        return session; // JWT не требует хранения сессии в базе
    }

    async getSessionAndUser(sessionToken: any) {
        return null; // JWT хранит сессию в токене
    }

    async updateSession(session: any) {
        return session; // JWT не обновляет сессию в базе
    }

    async deleteSession(sessionToken: any) {
        // Ничего не делаем, так как сессия в JWT
    }
}

export default UserService;