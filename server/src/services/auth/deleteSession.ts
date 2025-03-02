import { sign } from 'jsonwebtoken';

export async function deleteSession(sessionToken: string, prisma: any) {
    return prisma.session.delete({ where: { sessionToken } });
}