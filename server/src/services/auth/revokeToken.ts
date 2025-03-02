
export async function revokeToken(refreshToken: string, prisma: any) {
    const session = await prisma.session.findUnique({
        where: { refreshToken },
    });
    if (!session) throw new Error('Сессия не найдена');

  await prisma.session.delete({
    where: { refreshToken },
  });

  return { success: true, message: 'Токен отозван' };
}