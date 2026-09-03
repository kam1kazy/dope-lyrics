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
};

const QUATRAIN_LINES = PARAGRAPH_LINES;
const MAX_LINES_FROM_ONE = 8;
const PREFERRED_LINES_FROM_ONE = 4;
const TAKE_PREFERRED_CHANCE = 0.7;
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
    return randomInt(1, maxParagraphs) * QUATRAIN_LINES;
  }

  return randomInt(minParagraphs, maxParagraphs) * QUATRAIN_LINES;
};

const rangesOverlap = (
  start: number,
  end: number,
  taken: CollagePartStored[]
): boolean => {
  return taken.some((range) => start < range.endLine && range.startLine < end);
};

const unusedRuns = (
  lineCount: number,
  taken: CollagePartStored[]
): CollagePartStored[] => {
  const runs: CollagePartStored[] = [];
  let runStart: number | null = null;

  for (let line = 0; line <= lineCount; line += 1) {
    const takenHere =
      line < lineCount &&
      taken.some((range) => line >= range.startLine && line < range.endLine);

    if (line < lineCount && !takenHere) {
      if (runStart === null) {
        runStart = line;
      }
    } else if (runStart !== null) {
      runs.push({ lyricId: 0, startLine: runStart, endLine: line });
      runStart = null;
    }
  }

  return runs;
};

const pickLineWindow = (
  lineCount: number,
  remaining: number,
  taken: CollagePartStored[]
): CollagePartStored | null => {
  if (lineCount < 1 || remaining < 1) {
    return null;
  }

  const preferred: CollagePartStored[] = [];
  const longer: CollagePartStored[] = [];
  const leftover: CollagePartStored[] = [];

  for (const run of unusedRuns(lineCount, taken)) {
    const runLength = run.endLine - run.startLine;
    const cap = Math.min(runLength, remaining, MAX_LINES_FROM_ONE);
    if (cap < 1) {
      continue;
    }

    for (
      let start = run.startLine;
      start < run.endLine;
      start += QUATRAIN_LINES
    ) {
      const four = start + PREFERRED_LINES_FROM_ONE;
      if (
        four <= run.endLine &&
        PREFERRED_LINES_FROM_ONE <= remaining &&
        !rangesOverlap(start, four, taken)
      ) {
        preferred.push({ lyricId: 0, startLine: start, endLine: four });
      }

      const eight = start + MAX_LINES_FROM_ONE;
      if (
        eight <= run.endLine &&
        MAX_LINES_FROM_ONE <= remaining &&
        !rangesOverlap(start, eight, taken)
      ) {
        longer.push({ lyricId: 0, startLine: start, endLine: eight });
      }
    }

    leftover.push({
      lyricId: 0,
      startLine: run.startLine,
      endLine: run.startLine + cap,
    });
  }

  if (preferred.length > 0 && Math.random() < TAKE_PREFERRED_CHANCE) {
    return pickRandom(preferred) ?? null;
  }

  if (longer.length > 0) {
    return pickRandom(longer) ?? null;
  }

  if (preferred.length > 0) {
    return pickRandom(preferred) ?? null;
  }

  return pickRandom(leftover) ?? null;
};

const fillSlot = (
  pool: PoolLyric[],
  quota: LineQuota,
  used: Set<number>
): CollagePartStored[] => {
  const parts: CollagePartStored[] = [];
  const candidates = pool.filter(
    (item) => !used.has(item.id) && item.lines.length > 0
  );
  const target = pickSlotTarget(quota, candidates.length > 0);
  if (target < 1) {
    return parts;
  }

  const takenByLyric = new Map<number, CollagePartStored[]>();
  let count = 0;

  while (count < target && candidates.length > 0) {
    const remaining = target - count;
    if (remaining <= 0) {
      break;
    }

    const fresh = candidates.filter((item) => !takenByLyric.has(item.id));
    const poolPick = fresh.length > 0 ? fresh : candidates;
    const index = Math.floor(Math.random() * poolPick.length);
    const item = poolPick[index];
    if (!item) {
      break;
    }

    const taken = takenByLyric.get(item.id) ?? [];
    const window = pickLineWindow(item.lines.length, remaining, taken);
    if (!window) {
      const candidateIndex = candidates.findIndex(
        (candidate) => candidate.id === item.id
      );
      if (candidateIndex >= 0) {
        candidates.splice(candidateIndex, 1);
      }
      continue;
    }

    parts.push({
      lyricId: item.id,
      startLine: window.startLine,
      endLine: window.endLine,
    });
    takenByLyric.set(item.id, [...taken, window]);
    count += window.endLine - window.startLine;
  }

  for (const lyricId of takenByLyric.keys()) {
    used.add(lyricId);
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
