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

export const countPromptVersions = (userId: number) =>
  prisma.aiPrompt.count({ where: { userId } });

export type CreatePromptInput = {
  text: string;
  name: string;
  description: string;
};

export const createPrompt = async (
  userId: number,
  input: CreatePromptInput
) => {
  const name = input.name.trim();
  const description = input.description.trim();

  if (!name) {
    throw new Error('Укажите название промпта');
  }

  const current = await getCurrentPrompt(userId);

  if (
    current &&
    current.text === input.text &&
    current.name === name &&
    (current.description ?? '') === description
  ) {
    return current;
  }

  return prisma.aiPrompt.create({
    data: { userId, text: input.text, name, description: description || null },
  });
};
