import CredentialsProvider from 'next-auth/providers/credentials';

const Credentials = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              id
              name
              email
            }
          }
        `,
        variables: { email: credentials?.email, password: credentials?.password },
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.data?.login) {
      throw new Error(result.errors?.[0]?.message || "Неверные учетные данные");
    }

    const user = result.data.login;
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Создаем сессию напрямую
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
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
          sessionToken,
          userId: user.id.toString(),
          expires: expires.toISOString(),
        },
      }),
    });
    const sessionResult = await sessionRes.json();
    if (!sessionResult.data?.createSession) {
      throw new Error('Ошибка создания сессии');
    }

    return { ...user, sessionToken }; // Возвращаем пользователя с токеном
  },
});

export default Credentials;