import CredentialsProvider from "next-auth/providers/credentials";

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

    return result.data.login; // Возвращаем данные пользователя из GraphQL ответа
  },
});

export default Credentials;