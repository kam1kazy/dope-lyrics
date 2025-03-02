
export async function createSession(sessionToken: string, userId: string, refreshToken: string, expires: string, prisma: any) {
 return prisma.session.create({
    data: { sessionToken, userId: parseInt(userId), refreshToken, expires: new Date(expires) },
  });
}