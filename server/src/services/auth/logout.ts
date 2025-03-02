export async function logoutUser(prisma: any, setCookie: any, user: any) {
    if (!user) throw new Error('Не аутентифицирован');

    // Удаляем все сессии пользователя
    await prisma.session.deleteMany({
      where: { userId: parseInt(user.id) },
    });

    // Очищаем куки
    setCookie('token', '', { maxAge: 0, httpOnly: true, secure: true });
    setCookie('refresh_token', '', { maxAge: 0, httpOnly: true, secure: true });

    return 'Успешный выход';
}