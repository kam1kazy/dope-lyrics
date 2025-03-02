
import { sign } from 'jsonwebtoken';
import { AuthResponse } from '~/types/user';

/**
 * Регистрация пользователя
 * @param email: string
 * @param password: string
 * @param name: string
 * @param prisma: any
 * @param setCookie: any
 * @returns AuthResponse
 */

export async function createUser(email: string, password: string, name: string, prisma: any, setCookie: any): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Пользователь уже существует');

    const hashedPassword = await Bun.password.hash(password, { algorithm: 'bcrypt' });
    const user = await prisma.user.create({
        data: { email, password: hashedPassword, role: 'user', name },
    });

    // Генерируем и сохраняем JWT для refresh token
    const sessionToken = await sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string)
    const refreshToken = await sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
        expiresIn: '7d',
    })

    // Устанавливаем куки
    setCookie('token', sessionToken, { httpOnly: true, secure: true, maxAge: 15 * 60 }); // 15 минут
    setCookie('refresh_token', refreshToken, { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 }); // 7 дней


    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        user: user,
        refreshToken: refreshToken,
        sessionToken: sessionToken,
    };
}