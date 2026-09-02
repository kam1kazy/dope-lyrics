import { GraphQLError } from 'graphql';

import type { LyricSongRole } from '~/modules/lyrics/lyric-facets';
import { isLyricSongRole } from '~/modules/lyrics/lyric-facets';

export const TRACK_FRAME = [
  'INTRO',
  'VERSE',
  'HOOK',
  'VERSE',
  'BRIDGE',
  'HOOK',
] as const satisfies readonly LyricSongRole[];

export type TrackFrameRole = (typeof TRACK_FRAME)[number];

export type CollageSlotStored = {
  songRole: LyricSongRole;
  lyricId: number | null;
};

export type AssembledSlot = {
  songRole: LyricSongRole;
  lyricId: number | null;
};

const pickRandom = <T>(items: T[]): T | undefined => {
  if (items.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

/** Случайные слоты по каркасу без повтора lyricId. */
export const assembleSlotsFromPools = (
  pools: Record<string, number[]>
): AssembledSlot[] => {
  const used = new Set<number>();
  const slots: AssembledSlot[] = [];

  for (const songRole of TRACK_FRAME) {
    const candidates = (pools[songRole] ?? []).filter((id) => !used.has(id));
    const lyricId = pickRandom(candidates) ?? null;

    if (lyricId !== null) {
      used.add(lyricId);
    }

    slots.push({ songRole, lyricId });
  }

  return slots;
};

export const parseCollageSlotsInput = (input: unknown): CollageSlotStored[] => {
  if (!Array.isArray(input)) {
    throw new GraphQLError('Некорректные слоты склейки');
  }

  if (input.length !== TRACK_FRAME.length) {
    throw new GraphQLError('Число слотов не совпадает с каркасом трека');
  }

  const result: CollageSlotStored[] = [];

  for (let i = 0; i < TRACK_FRAME.length; i += 1) {
    const expectedRole = TRACK_FRAME[i];
    const raw = input[i];

    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new GraphQLError('Некорректный слот склейки');
    }

    const record = raw as Record<string, unknown>;
    const songRole = record.songRole;
    const lyricId = record.lyricId;

    if (typeof songRole !== 'string' || !isLyricSongRole(songRole)) {
      throw new GraphQLError('Неизвестная роль в слоте');
    }

    if (songRole !== expectedRole) {
      throw new GraphQLError('Порядок ролей не совпадает с каркасом трека');
    }

    if (lyricId !== null && lyricId !== undefined) {
      if (
        typeof lyricId !== 'number' ||
        !Number.isInteger(lyricId) ||
        lyricId < 1
      ) {
        throw new GraphQLError('Некорректный идентификатор фразы в слоте');
      }

      result.push({ songRole, lyricId });
    } else {
      result.push({ songRole, lyricId: null });
    }
  }

  return result;
};

export const slotsFromJson = (value: unknown): CollageSlotStored[] => {
  if (!Array.isArray(value)) {
    return TRACK_FRAME.map((songRole) => ({ songRole, lyricId: null }));
  }

  return value.map((item, index) => {
    const fallbackRole = TRACK_FRAME[index] ?? 'VERSE';

    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { songRole: fallbackRole, lyricId: null };
    }

    const record = item as Record<string, unknown>;
    const songRole =
      typeof record.songRole === 'string' && isLyricSongRole(record.songRole)
        ? record.songRole
        : fallbackRole;
    const lyricId =
      typeof record.lyricId === 'number' && Number.isInteger(record.lyricId)
        ? record.lyricId
        : null;

    return { songRole, lyricId };
  });
};
