import type { TrackFormQuotas } from '@/entities/lyric';
import { DEFAULT_TRACK_FORM_QUOTAS } from '@/features/catalog-assemble/lib/generator-form';
import {
  type CatalogSectionFilters,
  DATE_SORT_FIELDS,
  DEFAULT_GENERATOR_SECTION_FILTERS,
} from '@/shared/lib/catalog-section-filters';
import {
  LYRIC_DELIVERIES,
  LYRIC_DELIVERY_LABELS,
  LYRIC_ENERGIES,
  LYRIC_ENERGY_LABELS,
  LYRIC_MOOD_LABELS,
  LYRIC_MOODS,
  LYRIC_READINESS,
  LYRIC_READINESS_LABELS,
  LYRIC_SONG_ROLE_LABELS,
  LYRIC_SONG_ROLES,
  LYRIC_SOURCE_LABELS,
  LYRIC_SOURCES,
} from '@/shared/lib/lyric-facets';
import { SORT_MODES } from '@/shared/lib/lyric-view/lyric-view-context';
import {
  DEFAULT_EXCLUDED_SHELVES,
  SHELF_FLAGS,
} from '@/shared/lib/lyric-view/shelf-filter';

export type TrackTextGeneration = {
  form: TrackFormQuotas;
  hideAdlibs: boolean;
  filters: CatalogSectionFilters;
};

const SHELF_LABELS: Record<(typeof SHELF_FLAGS)[number], string> = {
  favorites: 'избранное',
  references: 'эталон',
  censored: 'цензура',
  hidden: 'скрытые',
  donors: 'доноры',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickOne = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T => allowed.find((item) => item === value) ?? fallback;

const pickMany = <T extends string>(
  value: unknown,
  allowed: readonly T[]
): T[] =>
  Array.isArray(value)
    ? allowed.filter((item) => value.some((entry) => entry === item))
    : [];

const pickStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const pickText = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const pickCount = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : fallback;

const parseFilters = (value: unknown): CatalogSectionFilters => {
  const defaults = DEFAULT_GENERATOR_SECTION_FILTERS;

  if (!isRecord(value)) {
    return structuredClone(defaults);
  }

  const dateSort = isRecord(value.dateSort) ? value.dateSort : {};

  return {
    sortMode: pickOne(value.sortMode, SORT_MODES, defaults.sortMode),
    shuffleSeed:
      typeof value.shuffleSeed === 'number' &&
      Number.isFinite(value.shuffleSeed)
        ? value.shuffleSeed
        : defaults.shuffleSeed,
    selectedTags: pickStrings(value.selectedTags),
    selectedEmojis: pickStrings(value.selectedEmojis),
    keyword: pickText(value.keyword),
    dateFrom: pickText(value.dateFrom),
    dateTo: pickText(value.dateTo),
    dateSort: {
      field: pickOne(dateSort.field, DATE_SORT_FIELDS, defaults.dateSort.field),
      direction: pickOne(
        dateSort.direction,
        ['asc', 'desc'],
        defaults.dateSort.direction
      ),
    },
    includeShelves: pickMany(value.includeShelves, SHELF_FLAGS),
    excludeShelves: Array.isArray(value.excludeShelves)
      ? pickMany(value.excludeShelves, SHELF_FLAGS)
      : [...DEFAULT_EXCLUDED_SHELVES],
    selectedSources: pickMany(value.selectedSources, LYRIC_SOURCES),
    mood: pickMany(value.mood, LYRIC_MOODS),
    excludeMood: pickMany(value.excludeMood, LYRIC_MOODS),
    delivery: pickMany(value.delivery, LYRIC_DELIVERIES),
    excludeDelivery: pickMany(value.excludeDelivery, LYRIC_DELIVERIES),
    songRole: pickMany(value.songRole, LYRIC_SONG_ROLES),
    excludeSongRole: pickMany(value.excludeSongRole, LYRIC_SONG_ROLES),
    readiness: pickMany(value.readiness, LYRIC_READINESS),
    excludeReadiness: pickMany(value.excludeReadiness, LYRIC_READINESS),
    energy: pickMany(value.energy, LYRIC_ENERGIES),
    excludeEnergy: pickMany(value.excludeEnergy, LYRIC_ENERGIES),
  };
};

/** `null` — настроек нет: поле пустое или не объект. Недостающие поля берутся по умолчанию. */
export const parseTrackTextGeneration = (
  raw: string | null
): TrackTextGeneration | null => {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const form = isRecord(parsed.form) ? parsed.form : {};
  const defaults = DEFAULT_TRACK_FORM_QUOTAS;

  return {
    form: {
      intro: pickCount(form.intro, defaults.intro),
      verse: pickCount(form.verse, defaults.verse),
      hook: pickCount(form.hook, defaults.hook),
      bridge: pickCount(form.bridge, defaults.bridge),
    },
    hideAdlibs: parsed.hideAdlibs === true,
    filters: parseFilters(parsed.filters),
  };
};

const FORM_PARTS: [keyof TrackFormQuotas, string][] = [
  ['intro', 'интро'],
  ['verse', 'куплет'],
  ['hook', 'хук'],
  ['bridge', 'бридж'],
];

const sameSet = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((item) => right.includes(item));

const labelled = <T extends string>(
  title: string,
  values: readonly T[],
  labels: Record<T, string>
): string[] =>
  values.length > 0
    ? [`${title}: ${values.map((v) => labels[v]).join(', ')}`]
    : [];

const activeFilters = (filters: CatalogSectionFilters): string[] => {
  const defaults = DEFAULT_GENERATOR_SECTION_FILTERS;
  const lines: string[] = [
    ...(filters.selectedTags.length > 0
      ? [`теги: ${filters.selectedTags.join(', ')}`]
      : []),
    ...(filters.selectedEmojis.length > 0
      ? [`эмодзи: ${filters.selectedEmojis.join(' ')}`]
      : []),
    ...(filters.keyword.trim() ? [`слово: ${filters.keyword.trim()}`] : []),
    ...(filters.dateFrom || filters.dateTo
      ? [`даты: ${filters.dateFrom || '…'} — ${filters.dateTo || '…'}`]
      : []),
    ...labelled('источник', filters.selectedSources, LYRIC_SOURCE_LABELS),
    ...labelled('настроение', filters.mood, LYRIC_MOOD_LABELS),
    ...labelled('без настроения', filters.excludeMood, LYRIC_MOOD_LABELS),
    ...labelled('подача', filters.delivery, LYRIC_DELIVERY_LABELS),
    ...labelled('без подачи', filters.excludeDelivery, LYRIC_DELIVERY_LABELS),
    ...labelled('роль', filters.songRole, LYRIC_SONG_ROLE_LABELS),
    ...labelled('без роли', filters.excludeSongRole, LYRIC_SONG_ROLE_LABELS),
    ...labelled('готовность', filters.readiness, LYRIC_READINESS_LABELS),
    ...labelled(
      'без готовности',
      filters.excludeReadiness,
      LYRIC_READINESS_LABELS
    ),
    ...labelled('энергия', filters.energy, LYRIC_ENERGY_LABELS),
    ...labelled('без энергии', filters.excludeEnergy, LYRIC_ENERGY_LABELS),
    ...labelled('полки', filters.includeShelves, SHELF_LABELS),
  ];

  if (!sameSet(filters.excludeShelves, defaults.excludeShelves)) {
    lines.push(
      filters.excludeShelves.length > 0
        ? `без полок: ${filters.excludeShelves.map((f) => SHELF_LABELS[f]).join(', ')}`
        : 'ни одна полка не исключена'
    );
  }

  return lines;
};

export type TrackTextGenerationSummary = {
  form: string;
  adlibs: string;
  filters: string[];
};

export const summarizeTrackTextGeneration = (
  generation: TrackTextGeneration
): TrackTextGenerationSummary => {
  const form = FORM_PARTS.filter(([key]) => generation.form[key] > 0)
    .map(([key, label]) => `${label} ×${generation.form[key]}`)
    .join(', ');

  return {
    form: form || 'пустая форма',
    adlibs: generation.hideAdlibs ? 'адлибы скрыты' : 'адлибы видны',
    filters: activeFilters(generation.filters),
  };
};
