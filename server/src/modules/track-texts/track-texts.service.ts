import { GraphQLError } from 'graphql';

import { prisma } from '~/infrastructure/prisma';
import { sourceTextFromSlots } from '~/modules/ai/ai.service';

const NOT_FOUND = 'Текст не найден';

export type CreateTrackTextInput = {
  slots: unknown;
  theme?: string | null;
  /** Без ответа ИИ текст стартует с исходных строк склейки. */
  aiText?: string | null;
  usageId?: number | null;
  hideAdlibs?: boolean | null;
};

const requireText = (value: string, label: string): string => {
  if (value.trim().length === 0) {
    throw new GraphQLError(`${label}: текст не может быть пустым`);
  }

  return value;
};

const findOwned = async (userId: number, id: number) => {
  const row = await prisma.trackText.findFirst({ where: { id, userId } });

  if (!row) {
    throw new GraphQLError(NOT_FOUND);
  }

  return row;
};

export const createTrackText = async (
  userId: number,
  input: CreateTrackTextInput
) => {
  const { slots, sourceText } = await sourceTextFromSlots(
    userId,
    input.slots,
    input.hideAdlibs === true
  );

  if (!sourceText) {
    throw new GraphQLError('В склейке нет строк');
  }

  const aiText =
    input.aiText === undefined || input.aiText === null
      ? sourceText
      : requireText(input.aiText, 'Ответ ИИ');

  const usage = input.usageId
    ? await prisma.aiUsage.findFirst({
        where: { id: input.usageId, userId },
        select: { id: true, promptId: true },
      })
    : null;

  if (input.usageId && !usage) {
    throw new GraphQLError('Запрос ИИ не найден');
  }

  return prisma.trackText.create({
    data: {
      userId,
      theme: input.theme?.trim() || null,
      slots,
      sourceText,
      aiText,
      text: aiText,
      usageId: usage?.id ?? null,
      promptId: usage?.promptId ?? null,
    },
  });
};

export const listTrackTexts = (userId: number) =>
  prisma.trackText.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
  });

export const getTrackText = (userId: number, id: number) =>
  findOwned(userId, id);

export const updateTrackText = async (
  userId: number,
  id: number,
  text: string
) => {
  await findOwned(userId, id);

  return prisma.trackText.update({
    where: { id },
    data: { text: requireText(text, 'Текст') },
  });
};

/** Финал = рабочая версия на момент нажатия; повторное «Готово» заменяет его. */
export const markTrackTextDone = async (userId: number, id: number) => {
  const row = await findOwned(userId, id);

  return prisma.trackText.update({
    where: { id },
    data: { finalText: row.text, doneAt: new Date() },
  });
};

/** Удаляет текст целиком; снимки хранились только в нём. */
export const deleteTrackText = async (userId: number, id: number) => {
  await findOwned(userId, id);
  await prisma.trackText.delete({ where: { id } });

  return id;
};
