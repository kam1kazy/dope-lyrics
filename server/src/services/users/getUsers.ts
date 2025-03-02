export async function getUsers(user: any, prisma: any) {
    if (!user || user.role !== 'admin') throw new Error('Нет доступа');
    return prisma.user.findMany();
}
