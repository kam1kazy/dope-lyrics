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
  type LyricDelivery,
  type LyricEnergy,
  type LyricMood,
} from '@/shared/lib/lyric-facets';
import { SORT_MODES } from '@/shared/lib/lyric-view/lyric-view-context';
import {
  DEFAULT_EXCLUDED_SHELVES,
  SHELF_FLAGS,
} from '@/shared/lib/lyric-view/shelf-filter';
import {
  EMPTY_REFERENCE_FILTER,
  type ReferenceFilter,
} from '@/shared/lib/reference-filter';

export type TrackTextGeneration = {
  form: TrackFormQuotas;
  hideAdlibs: boolean;
  filters: CatalogSectionFilters;
  references: ReferenceFilter;
};

export type ScratchFacets = {
  moods: LyricMood[];
  deliveries: LyricDelivery[];
  energies: LyricEnergy[];
};

export type ScratchPickedReference = {
  textId: number;
  artistName: string;
  title: string | null;
};

/** Настройки текста «С нуля»: в генератор не возвращаются. */
export type ScratchTextGeneration = {
  kind: 'scratch';
  form: TrackFormQuotas;
  facets: ScratchFacets;
  references: ReferenceFilter;
  picked: ScratchPickedReference[];
};

/** Имена эталонов для сводки: id артиста → имя, id текста → название. */
export type ReferenceNames = {
  artists: ReadonlyMap<number, string>;
  texts: ReadonlyMap<number, string>;
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

const pickIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (item): item is number =>
              typeof item === 'number' && Number.isInteger(item)
          )
        ),
      ]
    : [];

export const parseReferences = (value: unknown): ReferenceFilter =>
  isRecord(value)
    ? { artistIds: pickIds(value.artistIds), textIds: pickIds(value.textIds) }
    : { ...EMPTY_REFERENCE_FILTER };

export const parseFilters = (value: unknown): CatalogSectionFilters => {
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

const parseForm = (value: unknown): TrackFormQuotas => {
  const form = isRecord(value) ? value : {};
  const defaults = DEFAULT_TRACK_FORM_QUOTAS;

  return {
    intro: pickCount(form.intro, defaults.intro),
    verse: pickCount(form.verse, defaults.verse),
    hook: pickCount(form.hook, defaults.hook),
    bridge: pickCount(form.bridge, defaults.bridge),
  };
};

const parseJsonRecord = (
  raw: string | null
): Record<string, unknown> | null => {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** `null` — настроек нет: поле пустое или не объект. Недостающие поля берутся по умолчанию. Текст «С нуля» — тоже `null`. */
export const parseTrackTextGeneration = (
  raw: string | null
): TrackTextGeneration | null => {
  const parsed = parseJsonRecord(raw);
  if (!parsed || parsed.kind === 'scratch') {
    return null;
  }

  return {
    form: parseForm(parsed.form),
    hideAdlibs: parsed.hideAdlibs === true,
    filters: parseFilters(parsed.filters),
    references: parseReferences(parsed.references),
  };
};

const parsePicked = (value: unknown): ScratchPickedReference[] =>
  Array.isArray(value)
    ? value.filter(isRecord).flatMap((item) =>
        typeof item.textId === 'number' && typeof item.artistName === 'string'
          ? [
              {
                textId: item.textId,
                artistName: item.artistName,
                title: typeof item.title === 'string' ? item.title : null,
              },
            ]
          : []
      )
    : [];

export const parseFacets = (value: unknown): ScratchFacets => {
  const facets = isRecord(value) ? value : {};

  return {
    moods: pickMany(facets.moods, LYRIC_MOODS),
    deliveries: pickMany(facets.deliveries, LYRIC_DELIVERIES),
    energies: pickMany(facets.energies, LYRIC_ENERGIES),
  };
};

/** Настройки текста «С нуля»; `null` — у текста другие настройки или их нет. */
export const parseScratchGeneration = (
  raw: string | null
): ScratchTextGeneration | null => {
  const parsed = parseJsonRecord(raw);
  if (!parsed || parsed.kind !== 'scratch') {
    return null;
  }

  return {
    kind: 'scratch',
    form: parseForm(parsed.form),
    facets: parseFacets(parsed.facets),
    references: parseReferences(parsed.references),
    picked: parsePicked(parsed.picked),
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

const namedReferences = (
  references: ReferenceFilter,
  names: ReferenceNames
): string[] => {
  const artists = references.artistIds.flatMap((id) => {
    const name = names.artists.get(id);
    return name ? [name] : [];
  });
  const texts = references.textIds.flatMap((id) => {
    const name = names.texts.get(id);
    return name ? [`«${name}»`] : [];
  });

  return [
    ...(artists.length > 0 ? [`артисты: ${artists.join(', ')}`] : []),
    ...(texts.length > 0 ? [`тексты эталонов: ${texts.join(', ')}`] : []),
  ];
};

const NO_NAMES: ReferenceNames = { artists: new Map(), texts: new Map() };

const formSummary = (form: TrackFormQuotas): string =>
  FORM_PARTS.filter(([key]) => form[key] > 0)
    .map(([key, label]) => `${label} ×${form[key]}`)
    .join(', ') || 'пустая форма';

export type ScratchGenerationSummary = {
  form: string;
  facets: string[];
  references: string[];
};

/** Сводка «С нуля»: эталоны запроса без удалённых с полки; `liveTextIds = null` — полка не загружена, показать все. */
export const summarizeScratchGeneration = (
  generation: ScratchTextGeneration,
  liveTextIds: ReadonlySet<number> | null = null
): ScratchGenerationSummary => ({
  form: formSummary(generation.form),
  facets: [
    ...labelled('настроение', generation.facets.moods, LYRIC_MOOD_LABELS),
    ...labelled('подача', generation.facets.deliveries, LYRIC_DELIVERY_LABELS),
    ...labelled('энергия', generation.facets.energies, LYRIC_ENERGY_LABELS),
  ],
  references: generation.picked
    .filter((item) => liveTextIds === null || liveTextIds.has(item.textId))
    .map((item) =>
      item.title ? `${item.artistName} «${item.title}»` : item.artistName
    ),
});

export const summarizeTrackTextGeneration = (
  generation: TrackTextGeneration,
  names: ReferenceNames = NO_NAMES
): TrackTextGenerationSummary => {
  return {
    form: formSummary(generation.form),
    adlibs: generation.hideAdlibs ? 'адлибы скрыты' : 'адлибы видны',
    filters: [
      ...activeFilters(generation.filters),
      ...namedReferences(generation.references, names),
    ],
  };
};
