import { sign } from 'jsonwebtoken'
import { AuthResponse } from '~/types/user'

/**
 * Регистрация пользователя
 * @param email: string
 * @param password: string
 * @param name: string
 * @param prisma: any
 * @param setCookie: any
 * @returns AuthResponse
 */

export async function createUser(
	email: string,
	password: string,
	name: string,
	prisma: any,
	setCookie: any
): Promise<AuthResponse> {
	const existingUser = await prisma.user.findUnique({ where: { email } })
	if (existingUser) throw new Error('Пользователь уже существует')

	const hashedPassword = await Bun.password.hash(password, {
		algorithm: 'bcrypt'
	})
	const user = await prisma.user.create({
		data: { email, password: hashedPassword, role: 'user', name }
	})

	// Генерируем JWT токены
	if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET не установлен')

	// Создаем session token (короткий срок действия)
	const sessionToken = sign(
		{ id: user.id, role: user.role },
		process.env.JWT_SECRET,
		{ expiresIn: '15m' } // 15 минут
	)

	// Создаем refresh token (длительный срок действия)
	const refreshToken = sign(
		{ id: user.id, role: user.role },
		process.env.JWT_SECRET,
		{ expiresIn: '7d' } // 7 дней
	)

	// Сохраняем сессию в базе данных
	await prisma.session.create({
		data: {
			sessionToken,
			userId: user.id,
			refreshToken,
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
		}
	})

	// Устанавливаем куки
	setCookie('token', sessionToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'Strict',
		maxAge: 15 * 60 // 15 минут
	})

	setCookie('refresh_token', refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'Strict',
		maxAge: 7 * 24 * 60 * 60 // 7 дней
	})

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		user: user,
		refreshToken,
		sessionToken
	}
}
