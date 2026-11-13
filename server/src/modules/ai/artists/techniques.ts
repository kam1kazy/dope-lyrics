import type { TechniqueKind as StoredTechniqueKind } from '~/generated/prisma/client';

/** TONE — настроение и форма; в правку не уходит, остальные — по одному на часть. */
export type TechniqueKind = StoredTechniqueKind;

export const TECHNIQUE_KINDS = ['IMAGE', 'SOUND', 'WORDPLAY', 'TONE'] as const;

export const PICKED_KINDS = ['IMAGE', 'SOUND', 'WORDPLAY'] as const;

/** Хук короткий: игра слов из карточки забирает его целиком, слово карточки вместо образа трека. */
export const HOOK_PICKED_KINDS = ['IMAGE', 'SOUND'] as const;

export type PickedKind = (typeof PICKED_KINDS)[number];

export const isTechniqueKind = (value: string): value is TechniqueKind =>
  (TECHNIQUE_KINDS as readonly string[]).includes(value);

/** Карточка — не больше пяти приёмов. */
export const TECHNIQUE_LIMIT = 5;
