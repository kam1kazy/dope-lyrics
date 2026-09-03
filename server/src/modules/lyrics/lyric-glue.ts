import { GraphQLError } from 'graphql';

import {
  type CollagePartStored,
  type CollageSlotStored,
  SECOND_HOOK_INDEX,
  splitGeneratorLines,
} from '~/modules/lyrics/track-assemble';

export type GluePartPlacement = {
  lyricId: number;
  startLine: number;
  endLine: number;
  gluedStart: number;
  gluedEnd: number;
};

export type GlueBuildResult = {
  text: string;
  placements: GluePartPlacement[];
  cleanedLineCount: number;
};

const isOpenEnded = (endLine: number): boolean => endLine >= 1_000_000;

/** Сырые строки → индекс очищенной строки или null (пустая / только метки). */
export const mapRawLinesToCleaned = (text: string): (number | null)[] => {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const map: (number | null)[] = [];
  let cleanedIndex = 0;

  for (const raw of rawLines) {
    const cleaned = raw
      .replace(/\s*#[^\s]+/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length === 0) {
      map.push(null);
      continue;
    }

    map.push(cleanedIndex);
    cleanedIndex += 1;
  }

  return map;
};

export const unionLineRanges = (
  ranges: { startLine: number; endLine: number }[]
): { startLine: number; endLine: number }[] => {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((a, b) => a.startLine - b.startLine);
  const result: { startLine: number; endLine: number }[] = [];

  for (const range of sorted) {
    const last = result[result.length - 1];
    if (!last || range.startLine > last.endLine) {
      result.push({ ...range });
      continue;
    }

    last.endLine = Math.max(last.endLine, range.endLine);
  }

  return result;
};

/** Вырезать очищенные строки [start, end) из сырого текста. */
export const ripCleanedRangesFromText = (
  text: string,
  ranges: { startLine: number; endLine: number }[]
): { nextText: string; removed: boolean; emptied: boolean } => {
  const merged = unionLineRanges(ranges);
  if (merged.length === 0) {
    return { nextText: text, removed: false, emptied: false };
  }

  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const cleanedMap = mapRawLinesToCleaned(text);
  const removedCleaned = new Set<number>();

  for (const range of merged) {
    for (let index = range.startLine; index < range.endLine; index += 1) {
      removedCleaned.add(index);
    }
  }

  const keptRaw: string[] = [];
  let removedAny = false;

  for (let rawIndex = 0; rawIndex < rawLines.length; rawIndex += 1) {
    const cleanedIndex = cleanedMap[rawIndex];
    if (cleanedIndex != null && removedCleaned.has(cleanedIndex)) {
      removedAny = true;
      continue;
    }

    keptRaw.push(rawLines[rawIndex] ?? '');
  }

  const nextText = keptRaw.join('\n');
  const emptied = splitGeneratorLines(nextText).length === 0;

  if (emptied) {
    return { nextText: text, removed: false, emptied: true };
  }

  return { nextText, removed: removedAny, emptied: false };
};

/** Карта старый очищенный индекс → новый (или null если удалён). */
export const cleanedIndexShiftMap = (
  lineCount: number,
  removedRanges: { startLine: number; endLine: number }[]
): (number | null)[] => {
  const removed = new Set<number>();
  for (const range of unionLineRanges(removedRanges)) {
    for (let index = range.startLine; index < range.endLine; index += 1) {
      removed.add(index);
    }
  }

  const map: (number | null)[] = [];
  let next = 0;

  for (let index = 0; index < lineCount; index += 1) {
    if (removed.has(index)) {
      map.push(null);
      continue;
    }

    map.push(next);
    next += 1;
  }

  return map;
};

const findGluedPlacement = (
  placements: GluePartPlacement[],
  lyricId: number,
  lineIndex: number
): GluePartPlacement | null => {
  for (const placement of placements) {
    if (placement.lyricId !== lyricId) {
      continue;
    }

    if (lineIndex >= placement.startLine && lineIndex < placement.endLine) {
      return placement;
    }
  }

  return null;
};

const remapPartAfterRip = (
  part: CollagePartStored,
  donorId: number,
  gluedId: number,
  shiftMap: (number | null)[],
  placements: GluePartPlacement[],
  ripped: boolean
): CollagePartStored[] => {
  if (part.lyricId !== donorId) {
    return [part];
  }

  if (!ripped) {
    return [part];
  }

  const openEnd = isOpenEnded(part.endLine);
  const lineCount = shiftMap.length;
  const end = openEnd ? lineCount : Math.min(part.endLine, lineCount);
  const start = Math.min(part.startLine, lineCount);

  if (start >= end && !openEnd) {
    return [];
  }

  const result: CollagePartStored[] = [];
  let cursor = start;

  while (cursor < end || (openEnd && cursor === end && end === lineCount)) {
    if (openEnd && cursor >= lineCount) {
      break;
    }

    const shifted = shiftMap[cursor];
    if (shifted != null) {
      let runEnd = cursor + 1;
      while (runEnd < end && shiftMap[runEnd] != null) {
        runEnd += 1;
      }

      const newStart = shifted;
      const lastShifted = shiftMap[runEnd - 1];
      if (lastShifted == null) {
        break;
      }

      result.push({
        lyricId: donorId,
        startLine: newStart,
        endLine: openEnd && runEnd >= lineCount ? 1_000_000 : lastShifted + 1,
      });
      cursor = runEnd;
      continue;
    }

    const placement = findGluedPlacement(placements, donorId, cursor);
    if (!placement) {
      cursor += 1;
      continue;
    }

    let runEnd = cursor + 1;
    while (
      runEnd < end &&
      shiftMap[runEnd] == null &&
      findGluedPlacement(placements, donorId, runEnd)?.gluedStart ===
        placement.gluedStart
    ) {
      runEnd += 1;
    }

    const offsetInTaken = cursor - placement.startLine;
    const gluedStart = placement.gluedStart + offsetInTaken;
    const gluedEnd = placement.gluedStart + (runEnd - placement.startLine);

    if (gluedEnd > gluedStart) {
      result.push({
        lyricId: gluedId,
        startLine: gluedStart,
        endLine: gluedEnd,
      });
    }

    cursor = runEnd;
  }

  return result;
};

export const remapCollageSlotsAfterRip = (
  slots: CollageSlotStored[],
  donorId: number,
  gluedId: number,
  shiftMap: (number | null)[],
  placements: GluePartPlacement[],
  ripped: boolean
): CollageSlotStored[] => {
  return slots.map((slot) => ({
    songRole: slot.songRole,
    parts: slot.parts.flatMap((part) =>
      remapPartAfterRip(part, donorId, gluedId, shiftMap, placements, ripped)
    ),
  }));
};

export const buildGluedText = (
  slots: CollageSlotStored[],
  textsById: Map<number, string>
): GlueBuildResult => {
  const slotChunks: string[] = [];
  const placements: GluePartPlacement[] = [];
  let cleanedLineCount = 0;

  for (let index = 0; index < slots.length; index += 1) {
    if (index === SECOND_HOOK_INDEX) {
      continue;
    }

    const slot = slots[index];
    if (!slot || slot.parts.length === 0) {
      continue;
    }

    const chunkLines: string[] = [];

    for (const part of slot.parts) {
      const raw = textsById.get(part.lyricId);
      if (raw == null) {
        throw new GraphQLError('Фраза из сборки не найдена');
      }

      const lines = splitGeneratorLines(raw);
      const end = isOpenEnded(part.endLine)
        ? lines.length
        : Math.min(part.endLine, lines.length);
      const start = Math.min(part.startLine, lines.length);

      if (start >= end) {
        continue;
      }

      const slice = lines.slice(start, end);
      if (slice.length === 0) {
        continue;
      }

      const gluedStart = cleanedLineCount;
      chunkLines.push(...slice);
      cleanedLineCount += slice.length;
      placements.push({
        lyricId: part.lyricId,
        startLine: start,
        endLine: end,
        gluedStart,
        gluedEnd: cleanedLineCount,
      });
    }

    if (chunkLines.length > 0) {
      slotChunks.push(chunkLines.join('\n'));
    }
  }

  if (slotChunks.length === 0) {
    throw new GraphQLError('Нечего склеивать: в сборке нет строк');
  }

  return {
    text: slotChunks.join('\n\n'),
    placements,
    cleanedLineCount,
  };
};

export const collectTakenRangesByLyric = (
  placements: GluePartPlacement[]
): Map<number, { startLine: number; endLine: number }[]> => {
  const byId = new Map<number, { startLine: number; endLine: number }[]>();

  for (const placement of placements) {
    const list = byId.get(placement.lyricId) ?? [];
    list.push({
      startLine: placement.startLine,
      endLine: placement.endLine,
    });
    byId.set(placement.lyricId, list);
  }

  for (const [id, ranges] of byId) {
    byId.set(id, unionLineRanges(ranges));
  }

  return byId;
};
