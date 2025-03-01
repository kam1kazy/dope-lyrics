import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const res = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            id
            name
            email
            token
            sessionToken
          }
        }
      `,
      variables: { email, password },
    }),
  });
  const result = await res.json();
  if (result.data?.login) {
    const { token, sessionToken, ...user } = result.data.login;
    return NextResponse.json({ user, token }, {
      headers: {
        'Set-Cookie': `sessionToken=${sessionToken}; Path=/; HttpOnly; Expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}`,
      },
    });
  }
  return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 });
}