import { sign } from 'jsonwebtoken';

export async function loginUser(email: string, password: string, prisma: any, setCookie: any) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Неверные учетные данные');

    const isValid = await Bun.password.verify(password, user.password as string);
    if (!isValid) throw new Error('Неверные учетные данные');

    const sessionToken = sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string);
    const refreshToken = sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    // Сохраняем refresh token в сессии
    await prisma.session.create({
      data: {
        sessionToken: sessionToken,
        userId: user.id,
        refreshToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setCookie('token', sessionToken, { httpOnly: true, secure: true, maxAge: 15 * 60 });
    setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionToken,
      refreshToken,
    };
}