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

const PARAGRAPH_LINES = 4;

export const TRACK_QUOTAS: Record<
  TrackFormPreset,
  Record<TrackFrameRole, LineQuota>
> = {
  HIT: {
    INTRO: { min: 0, max: 4 * PARAGRAPH_LINES },
    VERSE: { min: 4 * PARAGRAPH_LINES, max: 6 * PARAGRAPH_LINES },
    HOOK: { min: 2 * PARAGRAPH_LINES, max: 4 * PARAGRAPH_LINES },
    BRIDGE: { min: 0, max: 4 * PARAGRAPH_LINES },
  },
  CANVAS: {
    INTRO: { min: 0, max: 4 * PARAGRAPH_LINES },
    VERSE: { min: 4 * PARAGRAPH_LINES, max: 8 * PARAGRAPH_LINES },
    HOOK: { min: 2 * PARAGRAPH_LINES, max: 8 * PARAGRAPH_LINES },
    BRIDGE: { min: 0, max: 4 * PARAGRAPH_LINES },
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
  songRoles: readonly string[];
};

const QUATRAIN_LINES = PARAGRAPH_LINES;
const MAX_LINES_FROM_ONE = 8;
const TAKE_PREFERRED_CHANCE = 0.7;
const LEGACY_END_LINE = 1_000_000;

/** Сначала обязательные слоты, потом опциональные — чтобы интро не съело пул. */
const FILL_FRAME_INDEXES = [2, 1, 3, 0, 4] as const;
const SECOND_HOOK_INDEX = 5;

export const stripGeneratorMarks = (text: string): string => {
  return text.replace(/\s*#[^\s]+/g, ' ').replace(/\[[^\]]*\]/g, ' ');
};

export const splitGeneratorLines = (text: string): string[] => {
  return stripGeneratorMarks(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
};

const shuffleInPlace = <T>(items: T[]): T[] => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = items[index];
    const other = items[swap];
    if (current === undefined || other === undefined) {
      continue;
    }

    items[index] = other;
    items[swap] = current;
  }

  return items;
};

const randomInt = (min: number, max: number): number => {
  if (max <= min) {
    return min;
  }

  return min + Math.floor(Math.random() * (max - min + 1));
};

const pickSlotTarget = (quota: LineQuota, hasCandidates: boolean): number => {
  if (!hasCandidates) {
    return 0;
  }

  const minParagraphs = Math.floor(quota.min / QUATRAIN_LINES);
  const maxParagraphs = Math.floor(quota.max / QUATRAIN_LINES);

  if (maxParagraphs < 1) {
    return quota.max;
  }

  if (quota.min === 0) {
    return randomInt(0, maxParagraphs) * QUATRAIN_LINES;
  }

  return randomInt(minParagraphs, maxParagraphs) * QUATRAIN_LINES;
};

const pickWindowSize = (): number => {
  return Math.random() < TAKE_PREFERRED_CHANCE
    ? QUATRAIN_LINES
    : MAX_LINES_FROM_ONE;
};

/** Для длинной фразы первый курсор — случайное смещение, кратное 4. */
const initialCursor = (lineCount: number): number => {
  if (lineCount <= MAX_LINES_FROM_ONE) {
    return 0;
  }

  const maxStart = lineCount - QUATRAIN_LINES;
  const steps = Math.floor(maxStart / QUATRAIN_LINES);
  if (steps < 1) {
    return 0;
  }

  return randomInt(0, steps) * QUATRAIN_LINES;
};

const takeChunk = (
  lineCount: number,
  cursor: number,
  remaining: number
): { startLine: number; endLine: number } | null => {
  const available = lineCount - cursor;
  if (available < 1 || remaining < 1) {
    return null;
  }

  const size =
    available <= MAX_LINES_FROM_ONE
      ? Math.min(available, remaining)
      : Math.min(pickWindowSize(), remaining);

  if (size < 1) {
    return null;
  }

  return { startLine: cursor, endLine: cursor + size };
};

/** Сначала роль слота, потом фразы без ролей; чужие роли не берём. */
const buildSlotPool = (
  catalog: PoolLyric[],
  role: TrackFrameRole,
  used: Set<number>
): PoolLyric[] => {
  const tagged: PoolLyric[] = [];
  const untagged: PoolLyric[] = [];

  for (const item of catalog) {
    if (used.has(item.id) || item.lines.length < 1) {
      continue;
    }

    if (item.songRoles.includes(role)) {
      tagged.push(item);
    } else if (item.songRoles.length === 0) {
      untagged.push(item);
    }
  }

  return [...shuffleInPlace(tagged), ...shuffleInPlace(untagged)];
};

const fillSlot = (
  pool: PoolLyric[],
  quota: LineQuota,
  used: Set<number>
): CollagePartStored[] => {
  const parts: CollagePartStored[] = [];
  const target = pickSlotTarget(quota, pool.length > 0);
  if (target < 1) {
    return parts;
  }

  const cursors = new Map<number, number>();
  for (const item of pool) {
    cursors.set(item.id, initialCursor(item.lines.length));
  }

  let count = 0;
  let progress = true;

  while (count < target && progress) {
    progress = false;

    for (const item of pool) {
      if (count >= target) {
        break;
      }

      const remaining = target - count;
      const cursor = cursors.get(item.id) ?? 0;
      const chunk = takeChunk(item.lines.length, cursor, remaining);
      if (!chunk) {
        continue;
      }

      parts.push({
        lyricId: item.id,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
      });
      cursors.set(item.id, chunk.endLine);
      count += chunk.endLine - chunk.startLine;
      progress = true;
    }
  }

  for (const part of parts) {
    used.add(part.lyricId);
  }

  return parts;
};

/** Слоты по каркасу: квота строк, без повтора lyricId, второй хук копирует первый. */
export const assembleSlotsFromPools = (
  catalog: PoolLyric[],
  preset: TrackFormPreset
): CollageSlotStored[] => {
  const used = new Set<number>();
  const slots: CollageSlotStored[] = TRACK_FRAME.map((songRole) => ({
    songRole,
    parts: [],
  }));
  let hookParts: CollagePartStored[] | null = null;

  for (const index of FILL_FRAME_INDEXES) {
    const songRole = TRACK_FRAME[index];
    const quota = TRACK_QUOTAS[preset][songRole];
    const pool = buildSlotPool(catalog, songRole, used);
    const parts = fillSlot(pool, quota, used);

    slots[index] = { songRole, parts };

    if (songRole === 'HOOK') {
      hookParts = parts;
    }
  }

  slots[SECOND_HOOK_INDEX] = {
    songRole: 'HOOK',
    parts: (hookParts ?? []).map((part) => ({ ...part })),
  };

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

const isOpenEnded = (endLine: number): boolean => {
  return endLine >= LEGACY_END_LINE;
};

const remapPartAfterSplit = (
  part: CollagePartStored,
  sourceId: number,
  bottomId: number,
  topLineCount: number
): CollagePartStored[] => {
  if (part.lyricId !== sourceId) {
    return [part];
  }

  const { startLine, endLine } = part;
  const openEnd = isOpenEnded(endLine);

  if (startLine >= topLineCount) {
    return [
      {
        lyricId: bottomId,
        startLine: startLine - topLineCount,
        endLine: openEnd ? LEGACY_END_LINE : endLine - topLineCount,
      },
    ];
  }

  if (!openEnd && endLine <= topLineCount) {
    return [part];
  }

  const remapped: CollagePartStored[] = [];
  const topEnd = openEnd ? LEGACY_END_LINE : topLineCount;

  if (topEnd > startLine) {
    remapped.push({
      lyricId: sourceId,
      startLine,
      endLine: topEnd,
    });
  }

  const bottomEnd = openEnd ? LEGACY_END_LINE : endLine - topLineCount;
  if (bottomEnd > 0) {
    remapped.push({
      lyricId: bottomId,
      startLine: 0,
      endLine: bottomEnd,
    });
  }

  return remapped;
};

/** После разреза индексы — по очищенным строкам верха (`splitGeneratorLines`). */
export const remapCollageSlotsAfterSplit = (
  slots: CollageSlotStored[],
  sourceId: number,
  bottomId: number,
  topLineCount: number
): CollageSlotStored[] => {
  const safeTopCount = Math.max(0, topLineCount);

  return slots.map((slot) => ({
    songRole: slot.songRole,
    parts: slot.parts.flatMap((part) =>
      remapPartAfterSplit(part, sourceId, bottomId, safeTopCount)
    ),
  }));
};
