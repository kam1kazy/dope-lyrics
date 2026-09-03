import type { IAssembledTrackSlot, TrackFormPreset } from '@/entities/lyric';
import type { LyricSongRole } from '@/shared/lib/lyric-facets';

export const TRACK_FORM_PRESET_LABELS: Record<TrackFormPreset, string> = {
  HIT: 'хит',
  CANVAS: 'полотно',
};

const EMPTY_SLOT_LABEL: Record<LyricSongRole, string> = {
  INTRO: 'без интро',
  HOOK: 'нет хука',
  BRIDGE: 'без бриджа',
  VERSE: 'нет кусков',
  SCENE: 'нет кусков',
  PUNCHLINE: 'нет кусков',
  SKETCH: 'нет кусков',
};

export const stripGeneratorMarks = (text: string): string => {
  return text.replace(/\s*#[^\s]+/g, ' ').replace(/\[[^\]]*\]/g, ' ');
};

export const splitGeneratorLines = (text: string): string[] => {
  return stripGeneratorMarks(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);
};

export const hideAdlibsInText = (text: string): string => {
  return text
    .replace(/\([^)]*\)/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
};

export const emptySlotLabel = (songRole: LyricSongRole): string => {
  return EMPTY_SLOT_LABEL[songRole] ?? 'нет кусков';
};

export const formatPartText = (
  raw: string,
  startLine: number,
  endLine: number,
  hideAdlibs: boolean
): string => {
  const sliced = splitGeneratorLines(raw).slice(startLine, endLine).join('\n');
  if (!sliced) {
    return '';
  }

  return hideAdlibs ? hideAdlibsInText(sliced) : sliced;
};

export const slotDisplayText = (
  slot: IAssembledTrackSlot,
  hideAdlibs: boolean
): { text: string; empty: boolean } => {
  if (slot.parts.length === 0) {
    return { text: emptySlotLabel(slot.songRole), empty: true };
  }

  const chunks = slot.parts
    .map((part) => {
      const raw = part.lyric?.message?.text?.trim() ?? '';
      if (!raw) {
        return '';
      }

      return formatPartText(raw, part.startLine, part.endLine, hideAdlibs);
    })
    .filter((chunk) => chunk.length > 0);

  if (chunks.length === 0) {
    return { text: 'фраза удалена', empty: true };
  }

  return { text: chunks.join('\n\n'), empty: false };
};
