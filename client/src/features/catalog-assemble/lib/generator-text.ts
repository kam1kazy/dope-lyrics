import type { IAssembledTrackSlot, TrackFormPreset } from '@/entities/lyric';
import { formatRuDateTime } from '@/shared/lib/format-datetime';
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

const QUATRAIN_LINES = 4;
const PREVIEW_LINES = 2;

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

const slotSourceLines = (
  slot: IAssembledTrackSlot,
  hideAdlibs: boolean
): { lines: string[]; empty: boolean; placeholder: string } => {
  if (slot.parts.length === 0) {
    return {
      lines: [],
      empty: true,
      placeholder: emptySlotLabel(slot.songRole),
    };
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
    return { lines: [], empty: true, placeholder: 'фраза удалена' };
  }

  return {
    lines: chunks
      .join('\n')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
    empty: false,
    placeholder: '',
  };
};

export const formatQuatrains = (lines: string[]): string => {
  const stanzas: string[] = [];

  for (let index = 0; index < lines.length; index += QUATRAIN_LINES) {
    stanzas.push(lines.slice(index, index + QUATRAIN_LINES).join('\n'));
  }

  return stanzas.join('\n\n');
};

export const slotDisplayText = (
  slot: IAssembledTrackSlot,
  hideAdlibs: boolean
): { text: string; empty: boolean } => {
  const source = slotSourceLines(slot, hideAdlibs);
  if (source.empty) {
    return { text: source.placeholder, empty: true };
  }

  return { text: formatQuatrains(source.lines), empty: false };
};

export const collagePreviewText = (
  slots: IAssembledTrackSlot[],
  hideAdlibs: boolean
): string => {
  for (const slot of slots) {
    const source = slotSourceLines(slot, hideAdlibs);
    if (source.empty || source.lines.length === 0) {
      continue;
    }

    const preview = source.lines.slice(0, PREVIEW_LINES).join('\n');
    if (source.lines.length > PREVIEW_LINES) {
      return `${preview}…`;
    }

    return preview;
  }

  return 'Пустая склейка';
};

export const formatCollageDate = (iso: string): string => {
  return formatRuDateTime(iso);
};
