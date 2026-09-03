import type { TrackFormPreset, TrackFormQuotas } from '@/entities/lyric';

export const TRACK_FORM_PRESETS: TrackFormPreset[] = ['HIT', 'CANVAS'];

export const TRACK_FORM_PRESET_QUOTAS: Record<
  TrackFormPreset,
  TrackFormQuotas
> = {
  HIT: { intro: 0, verse: 6, hook: 2, bridge: 0 },
  CANVAS: { intro: 0, verse: 8, hook: 4, bridge: 0 },
};

export const DEFAULT_TRACK_FORM_QUOTAS: TrackFormQuotas =
  TRACK_FORM_PRESET_QUOTAS.HIT;

const STORAGE_KEY = 'dope-lyrics.generator-form';

export const quotasEqual = (
  left: TrackFormQuotas,
  right: TrackFormQuotas
): boolean =>
  left.intro === right.intro &&
  left.verse === right.verse &&
  left.hook === right.hook &&
  left.bridge === right.bridge;

export const matchingTrackFormPreset = (
  quotas: TrackFormQuotas
): TrackFormPreset | null => {
  for (const preset of TRACK_FORM_PRESETS) {
    if (quotasEqual(quotas, TRACK_FORM_PRESET_QUOTAS[preset])) {
      return preset;
    }
  }

  return null;
};

const parseCount = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
};

export const readGeneratorForm = (): TrackFormQuotas => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_TRACK_FORM_QUOTAS };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_TRACK_FORM_QUOTAS };
    }

    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') {
      return { ...DEFAULT_TRACK_FORM_QUOTAS };
    }

    const record = parsed as Record<string, unknown>;
    const intro = parseCount(record.intro);
    const verse = parseCount(record.verse);
    const hook = parseCount(record.hook);
    const bridge = parseCount(record.bridge);
    if (intro == null || verse == null || hook == null || bridge == null) {
      return { ...DEFAULT_TRACK_FORM_QUOTAS };
    }

    return { intro, verse, hook, bridge };
  } catch {
    return { ...DEFAULT_TRACK_FORM_QUOTAS };
  }
};

export const writeGeneratorForm = (quotas: TrackFormQuotas): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quotas));
  } catch {
    return;
  }
};
