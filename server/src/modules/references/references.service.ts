import { GraphQLError } from 'graphql';

import type { Prisma } from '~/generated/prisma/client';
import { prisma } from '~/infrastructure/prisma';
import {
  isTechniqueKind,
  TECHNIQUE_LIMIT,
  type TechniqueKind,
} from '~/modules/ai/artists/techniques';
import {
  isLyricDelivery,
  isLyricEnergy,
  isLyricMood,
  isLyricSongRole,
  parseFacet,
  parseFacetList,
} from '~/modules/lyrics/lyric-facets';

const ARTIST_NOT_FOUND = 'Артист не найден';
const TEXT_NOT_FOUND = 'Текст не найден';
const NAME_MAX = 80;
const TITLE_MAX = 120;
const TEXT_MAX = 20_000;
const NOTE_MAX = 2_000;
const LABEL_MAX = 80;
const INSTRUCTION_MAX = 500;

export const artistInclude = {
  techniques: { orderBy: { position: 'asc' } },
  texts: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
} satisfies Prisma.ArtistInclude;

export type TechniqueInput = {
  kind: string;
  label: string;
  instruction: string;
};

export type ArtistInput = {
  name: string;
  moods: string[];
  energies: string[];
  deliveries: string[];
  techniques: TechniqueInput[];
};

export type ReferenceTags = {
  mood: string[];
  delivery: string[];
  songRole: string[];
  energy: string | null;
};

export type ReferenceTextInput = {
  title?: string | null;
  text?: string | null;
  note?: string | null;
  mood?: string[] | null;
  delivery?: string[] | null;
  songRole?: string[] | null;
  energy?: string | null;
};

const limited = (value: string, max: number, label: string): string => {
  if (value.length > max) {
    throw new GraphQLError(`${label}: не длиннее ${max} символов`);
  }

  return value;
};

const parseName = (value: string): string => {
  const name = value.replace(/\s+/g, ' ').trim();

  if (!name) {
    throw new GraphQLError('Имя артиста не может быть пустым');
  }

  return limited(name, NAME_MAX, 'Имя артиста');
};

const optionalText = (
  value: string | null | undefined,
  max: number,
  label: string
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? '';
  return trimmed ? limited(trimmed, max, label) : null;
};

const parseTechniques = (
  items: readonly TechniqueInput[]
): { kind: TechniqueKind; label: string; instruction: string }[] => {
  if (items.length > TECHNIQUE_LIMIT) {
    throw new GraphQLError(`У артиста не больше ${TECHNIQUE_LIMIT} приёмов`);
  }

  return items.map((item) => {
    if (!isTechniqueKind(item.kind)) {
      throw new GraphQLError('Неизвестный вид приёма');
    }

    const label = item.label.trim();
    const instruction = item.instruction.trim();

    if (!label || !instruction) {
      throw new GraphQLError('У приёма нужны ярлык и инструкция');
    }

    return {
      kind: item.kind,
      label: limited(label, LABEL_MAX, 'Ярлык приёма'),
      instruction: limited(instruction, INSTRUCTION_MAX, 'Инструкция приёма'),
    };
  });
};

export const parseReferenceTags = (input: {
  mood?: string[] | null;
  delivery?: string[] | null;
  songRole?: string[] | null;
  energy?: string | null;
}) => ({
  mood: parseFacetList(input.mood, isLyricMood, 'настроение'),
  delivery: parseFacetList(input.delivery, isLyricDelivery, 'подача'),
  songRole: parseFacetList(input.songRole, isLyricSongRole, 'роль в песне'),
  energy: parseFacet(input.energy, isLyricEnergy, 'энергия'),
});

const ensureUniqueName = async (
  userId: number,
  name: string,
  exceptId?: number
) => {
  const clash = await prisma.artist.findFirst({
    where: {
      userId,
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });

  if (clash) {
    throw new GraphQLError('Такой артист уже есть');
  }
};

const findOwnedArtist = async (userId: number, id: number) => {
  const row = await prisma.artist.findFirst({
    where: { id, userId },
    include: artistInclude,
  });

  if (!row) {
    throw new GraphQLError(ARTIST_NOT_FOUND);
  }

  return row;
};

const findOwnedText = async (userId: number, id: number) => {
  const row = await prisma.referenceText.findFirst({
    where: { id, artist: { userId } },
    include: { artist: { select: { name: true } } },
  });

  if (!row) {
    throw new GraphQLError(TEXT_NOT_FOUND);
  }

  return row;
};

export const listArtists = (userId: number) =>
  prisma.artist.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: artistInclude,
  });

export const getArtist = (userId: number, id: number) =>
  findOwnedArtist(userId, id);

export const createArtist = async (userId: number, rawName: string) => {
  const name = parseName(rawName);
  await ensureUniqueName(userId, name);

  return prisma.artist.create({
    data: { userId, name },
    include: artistInclude,
  });
};

/** Карточка целиком: приёмы заменяются списком из формы, порядок — как в форме. */
export const updateArtist = async (
  userId: number,
  id: number,
  input: ArtistInput
) => {
  await findOwnedArtist(userId, id);

  const name = parseName(input.name);
  const moods = parseFacetList(input.moods, isLyricMood, 'настроение') ?? [];
  const energies =
    parseFacetList(input.energies, isLyricEnergy, 'энергия') ?? [];
  const deliveries =
    parseFacetList(input.deliveries, isLyricDelivery, 'подача') ?? [];
  const techniques = parseTechniques(input.techniques);

  await ensureUniqueName(userId, name, id);

  return prisma.$transaction(async (tx) => {
    await tx.artistTechnique.deleteMany({ where: { artistId: id } });

    return tx.artist.update({
      where: { id },
      data: {
        name,
        moods,
        energies,
        deliveries,
        techniques: {
          create: techniques.map((item, position) => ({ ...item, position })),
        },
      },
      include: artistInclude,
    });
  });
};

export const deleteArtist = async (userId: number, id: number) => {
  await findOwnedArtist(userId, id);
  await prisma.artist.delete({ where: { id } });

  return true;
};

const parseBody = (value: string): string => {
  if (!value.trim()) {
    throw new GraphQLError('Текст не может быть пустым');
  }

  return limited(value.trim(), TEXT_MAX, 'Текст');
};

export const createReferenceText = async (
  userId: number,
  input: { artistId: number; title?: string | null; text: string }
) => {
  await findOwnedArtist(userId, input.artistId);

  return prisma.referenceText.create({
    data: {
      artistId: input.artistId,
      title: optionalText(input.title, TITLE_MAX, 'Название') ?? null,
      text: parseBody(input.text),
    },
    include: { artist: { select: { name: true } } },
  });
};

/**
 * Частичная правка. Ручные теги ставят `taggedAt`;
 * новый текст без тегов сбрасывает его — теги надо поставить заново.
 */
export const updateReferenceText = async (
  userId: number,
  id: number,
  input: ReferenceTextInput
) => {
  const current = await findOwnedText(userId, id);
  const text =
    input.text === undefined || input.text === null
      ? undefined
      : parseBody(input.text);
  const tags = parseReferenceTags(input);
  const tagsGiven =
    tags.mood !== undefined ||
    tags.delivery !== undefined ||
    tags.songRole !== undefined ||
    tags.energy !== undefined;
  const textChanged = text !== undefined && text !== current.text;

  return prisma.referenceText.update({
    where: { id },
    data: {
      title: optionalText(input.title, TITLE_MAX, 'Название'),
      note: optionalText(input.note, NOTE_MAX, 'Пояснение'),
      text,
      ...tags,
      ...(tagsGiven
        ? { taggedAt: new Date() }
        : textChanged
          ? { taggedAt: null }
          : {}),
    },
    include: { artist: { select: { name: true } } },
  });
};

export const saveReferenceTags = async (
  userId: number,
  id: number,
  tags: ReferenceTags
) => {
  await findOwnedText(userId, id);

  return prisma.referenceText.update({
    where: { id },
    data: { ...tags, taggedAt: new Date() },
    include: { artist: { select: { name: true } } },
  });
};

export const getReferenceText = (userId: number, id: number) =>
  findOwnedText(userId, id);

export const deleteReferenceText = async (userId: number, id: number) => {
  await findOwnedText(userId, id);
  await prisma.referenceText.delete({ where: { id } });

  return true;
};
