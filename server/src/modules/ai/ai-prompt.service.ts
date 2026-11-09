import { prisma } from '~/infrastructure/prisma';

export const getCurrentPrompt = (userId: number) =>
  prisma.aiPrompt.findFirst({
    where: { userId },
    orderBy: { id: 'desc' },
  });

export const listPromptVersions = (userId: number) =>
  prisma.aiPrompt.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
  });

export const savePrompt = async (userId: number, text: string) => {
  const current = await getCurrentPrompt(userId);

  if (current && current.text === text) {
    return current;
  }

  return prisma.aiPrompt.create({ data: { userId, text } });
};
