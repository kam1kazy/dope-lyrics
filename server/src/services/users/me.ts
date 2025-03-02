export async function getUser(user: any, prisma: any) {
  if (!user) throw new Error('Не аутентифицирован')
  const foundUser = await prisma.user.findUnique({
    where: { id: parseInt(user.id) },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!foundUser) throw new Error('Пользователь не найден')
  return foundUser
}
