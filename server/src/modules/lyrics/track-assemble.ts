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

export const TRACK_FORM_PRESETS = ['HIT', 'CANVAS'] as const;

export type TrackFormPreset = (typeof TRACK_FORM_PRESETS)[number];

export const isTrackFormPreset = (value: string): value is TrackFormPreset =>
  (TRACK_FORM_PRESETS as readonly string[]).includes(value);

type LineQuota = {
  min: number;
  max: number;
};

export const TRACK_QUOTAS: Record<
  TrackFormPreset,
  Record<TrackFrameRole, LineQuota>
> = {
  HIT: {
    INTRO: { min: 2, max: 4 },
    VERSE: { min: 8, max: 16 },
    HOOK: { min: 4, max: 8 },
    BRIDGE: { min: 4, max: 8 },
  },
  CANVAS: {
    INTRO: { min: 2, max: 4 },
    VERSE: { min: 16, max: 32 },
    HOOK: { min: 4, max: 8 },
    BRIDGE: { min: 8, max: 16 },
  },
};

export type CollagePartStored = {
  lyricId: number;
  startLine: number;
  endLine: number;
};

export type CollageSlotStored = {
  songRole: LyricSongRole;
  parts: CollagePartStored[];
};

export type PoolLyric = {
  id: number;
  lines: string[];
};

const QUATRAIN_LINES = 4;
const LEGACY_END_LINE = 1_000_000;

export const stripGeneratorMarks = (text: string): string => {
  return text.replace(/\s*#[^\s]+/g, ' ').replace(/\[[^\]]*\]/g, ' ');
};

export const splitGeneratorLines = (text: string): string[] => {
  return stripGeneratorMarks(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
};

const pickRandom = <T>(items: T[]): T | undefined => {
  if (items.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

const pickLineWindow = (
  lineCount: number,
  remaining: number
): CollagePartStored | null => {
  if (lineCount < 1 || remaining < 1) {
    return null;
  }

  const take = Math.min(lineCount, remaining);

  if (lineCount <= remaining) {
    return { lyricId: 0, startLine: 0, endLine: lineCount };
  }

  const maxStart = lineCount - take;
  const aligned: number[] = [];

  for (let start = 0; start <= maxStart; start += QUATRAIN_LINES) {
    aligned.push(start);
  }

  const startLine = pickRandom(aligned) ?? 0;

  return { lyricId: 0, startLine, endLine: startLine + take };
};

const fillSlot = (
  pool: PoolLyric[],
  quota: LineQuota,
  used: Set<number>
): CollagePartStored[] => {
  const parts: CollagePartStored[] = [];
  let count = 0;
  const candidates = pool.filter(
    (item) => !used.has(item.id) && item.lines.length > 0
  );

  while (count < quota.min && candidates.length > 0) {
    const remaining = quota.max - count;
    if (remaining <= 0) {
      break;
    }

    const index = Math.floor(Math.random() * candidates.length);
    const item = candidates.splice(index, 1)[0];
    if (!item) {
      break;
    }

    const window = pickLineWindow(item.lines.length, remaining);
    if (!window) {
      continue;
    }

    parts.push({
      lyricId: item.id,
      startLine: window.startLine,
      endLine: window.endLine,
    });
    used.add(item.id);
    count += window.endLine - window.startLine;
  }

  return parts;
};

/** Слоты по каркасу: квота строк, без повтора lyricId, второй хук копирует первый. */
export const assembleSlotsFromPools = (
  pools: Record<string, PoolLyric[]>,
  preset: TrackFormPreset
): CollageSlotStored[] => {
  const used = new Set<number>();
  const slots: CollageSlotStored[] = [];
  let hookParts: CollagePartStored[] | null = null;

  for (const songRole of TRACK_FRAME) {
    if (songRole === 'HOOK' && hookParts !== null) {
      slots.push({
        songRole,
        parts: hookParts.map((part) => ({ ...part })),
      });
      continue;
    }

    const quota = TRACK_QUOTAS[preset][songRole];
    const parts = fillSlot(pools[songRole] ?? [], quota, used);

    if (songRole === 'HOOK') {
      hookParts = parts;
    }

    slots.push({ songRole, parts });
  }

  return slots;
};

const parsePart = (raw: unknown): CollagePartStored => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new GraphQLError('Некорректный кусок склейки');
  }

  const record = raw as Record<string, unknown>;
  const lyricId = record.lyricId;
  const startLine = record.startLine;
  const endLine = record.endLine;

  if (
    typeof lyricId !== 'number' ||
    !Number.isInteger(lyricId) ||
    lyricId < 1
  ) {
    throw new GraphQLError('Некорректный идентификатор фразы в слоте');
  }

  if (
    typeof startLine !== 'number' ||
    !Number.isInteger(startLine) ||
    startLine < 0
  ) {
    throw new GraphQLError('Некорректный диапазон строк в слоте');
  }

  if (
    typeof endLine !== 'number' ||
    !Number.isInteger(endLine) ||
    endLine <= startLine
  ) {
    throw new GraphQLError('Некорректный диапазон строк в слоте');
  }

  return { lyricId, startLine, endLine };
};

const parseParts = (raw: unknown): CollagePartStored[] => {
  if (raw === undefined || raw === null) {
    return [];
  }

  if (!Array.isArray(raw)) {
    throw new GraphQLError('Некорректные куски склейки');
  }

  return raw.map(parsePart);
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

    if (typeof songRole !== 'string' || !isLyricSongRole(songRole)) {
      throw new GraphQLError('Неизвестная роль в слоте');
    }

    if (songRole !== expectedRole) {
      throw new GraphQLError('Порядок ролей не совпадает с каркасом трека');
    }

    result.push({
      songRole,
      parts: parseParts(record.parts),
    });
  }

  return result;
};

const partsFromLegacy = (
  record: Record<string, unknown>
): CollagePartStored[] => {
  const lyricId = record.lyricId;

  if (
    typeof lyricId !== 'number' ||
    !Number.isInteger(lyricId) ||
    lyricId < 1
  ) {
    return [];
  }

  return [{ lyricId, startLine: 0, endLine: LEGACY_END_LINE }];
};

const partsFromJson = (
  record: Record<string, unknown>
): CollagePartStored[] => {
  const raw = record.parts;

  if (!Array.isArray(raw)) {
    return partsFromLegacy(record);
  }

  const parts: CollagePartStored[] = [];

  for (const item of raw) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue;
    }

    const part = item as Record<string, unknown>;
    const lyricId = part.lyricId;
    const startLine = part.startLine;
    const endLine = part.endLine;

    if (
      typeof lyricId !== 'number' ||
      !Number.isInteger(lyricId) ||
      lyricId < 1
    ) {
      continue;
    }

    if (
      typeof startLine !== 'number' ||
      !Number.isInteger(startLine) ||
      startLine < 0
    ) {
      continue;
    }

    if (
      typeof endLine !== 'number' ||
      !Number.isInteger(endLine) ||
      endLine <= startLine
    ) {
      continue;
    }

    parts.push({ lyricId, startLine, endLine });
  }

  return parts;
};

export const slotsFromJson = (value: unknown): CollageSlotStored[] => {
  if (!Array.isArray(value)) {
    return TRACK_FRAME.map((songRole) => ({ songRole, parts: [] }));
  }

  return value.map((item, index) => {
    const fallbackRole = TRACK_FRAME[index] ?? 'VERSE';

    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { songRole: fallbackRole, parts: [] };
    }

    const record = item as Record<string, unknown>;
    const songRole =
      typeof record.songRole === 'string' && isLyricSongRole(record.songRole)
        ? record.songRole
        : fallbackRole;

    return { songRole, parts: partsFromJson(record) };
  });
};

export const lyricIdsFromSlots = (slots: CollageSlotStored[]): number[] => {
  const ids = new Set<number>();

  for (const slot of slots) {
    for (const part of slot.parts) {
      ids.add(part.lyricId);
    }
  }

  return [...ids];
};
