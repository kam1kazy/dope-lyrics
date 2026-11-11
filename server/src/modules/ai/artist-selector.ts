import { z } from 'zod';

import {
  artistById,
  catalogForSelector,
} from '~/modules/ai/artist-orientation';
import { stripModelWrapper } from '~/modules/ai/collage-rewrite';

export const SELECTOR_FRAME_VERSION = 1;

const MAX_ARTISTS_PER_SECTION = 2;

const INTENSITY_LABELS = {
  moderate: 'Сдержанно',
  high: 'Активно',
  radical: 'Жёстко: целую часть только если она рассыпается',
} as const;

export type EditingIntensity = keyof typeof INTENSITY_LABELS;

export type SelectorSectionInput = {
  sectionId: string;
  label: string;
  text: string;
  moods: readonly string[];
  energies: readonly string[];
  deliveries: readonly string[];
};

export type SelectedSection = {
  sectionId: string;
  intensity: EditingIntensity | null;
  artists: {
    artistId: string;
    name: string;
    labels: string[];
  }[];
};

const selectedSchema = z.object({
  artistId: z.string(),
  techniques: z.array(z.string()).optional(),
  reason: z.string().optional(),
});

const sectionSchema = z.object({
  sectionId: z.string(),
  mood: z.array(z.string()).optional(),
  energy: z.string().optional(),
  selected: z.array(selectedSchema).optional(),
  editingIntensity: z.enum(['moderate', 'high', 'radical']).optional(),
});

const briefSchema = z.object({
  sections: z.array(sectionSchema),
});

export const SELECTOR_SYSTEM = [
  'Ты выбираешь художественные приёмы для правки рэп-склейки. Текст трека не пишешь.',
  'Каталог ниже — единственный источник. Бери только эти artistId и id приёмов.',
  'На каждую часть не больше двух артистов, чьи настроение, энергия или подача близки к грани части.',
  'Приём бери из карточки этого артиста. Не копируй чужие строки и не пересказывай каталог.',
  'Если часть уже сильная или граней нет, selected оставь пустым.',
  'Ответь одним JSON без markdown:',
  '{"sections":[{"sectionId":"1:VERSE","mood":["LONGING"],"energy":"QUIET","editingIntensity":"moderate","selected":[{"artistId":"future","techniques":["numb-longing"],"reason":"коротко зачем"}]}]}',
  '',
  'Каталог:',
  catalogForSelector(),
].join('\n');

export const buildSelectorUser = (
  sections: readonly SelectorSectionInput[]
): string =>
  sections
    .map((section) => {
      const facets = [
        `настроение: ${section.moods.join(', ') || 'нет'}`,
        `энергия: ${section.energies.join(', ') || 'нет'}`,
        `подача: ${section.deliveries.join(', ') || 'нет'}`,
      ].join('\n');

      return [
        `${section.sectionId} | ${section.label}`,
        facets,
        section.text,
      ].join('\n');
    })
    .join('\n\n');

const parseJsonObject = (text: string): unknown => {
  const stripped = stripModelWrapper(text);

  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start < 0 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(stripped.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

/** Оставляет только известные id. Пустой результат — null, редактор берёт запасной список. */
export const sanitizeSelectorBrief = (
  text: string,
  knownSectionIds: readonly string[]
): SelectedSection[] | null => {
  const parsed = briefSchema.safeParse(parseJsonObject(text));
  if (!parsed.success) {
    return null;
  }

  const known = new Set(knownSectionIds);
  const picked: SelectedSection[] = [];

  for (const section of parsed.data.sections) {
    if (!known.has(section.sectionId)) {
      continue;
    }

    const artists: SelectedSection['artists'] = [];

    for (const item of section.selected ?? []) {
      if (artists.length >= MAX_ARTISTS_PER_SECTION) {
        break;
      }

      const artist = artistById(item.artistId);
      if (!artist) {
        continue;
      }

      const allowed = new Set(
        artist.techniques.map((technique) => technique.id)
      );
      const labels = (item.techniques ?? []).flatMap((id) => {
        if (!allowed.has(id)) {
          return [];
        }

        const label = artist.techniques.find(
          (technique) => technique.id === id
        )?.label;

        return label ? [label] : [];
      });

      if (labels.length === 0) {
        continue;
      }

      artists.push({ artistId: artist.id, name: artist.name, labels });
    }

    if (artists.length === 0) {
      continue;
    }

    picked.push({
      sectionId: section.sectionId,
      intensity: section.editingIntensity ?? null,
      artists,
    });
  }

  return picked.length > 0 ? picked : null;
};

export const orientationFromSelection = (
  order: readonly { sectionId: string; label: string }[],
  picked: readonly SelectedSection[]
): string | null => {
  const byId = new Map(picked.map((section) => [section.sectionId, section]));
  const blocks = [
    'Ориентир на эту склейку. Бери приём своей части, не всех артистов сразу. Чужие строки не копируй.',
  ];

  for (const section of order) {
    const choice = byId.get(section.sectionId);
    if (!choice) {
      continue;
    }

    const lines = choice.artists.map(
      (artist) => `${artist.name} — ${artist.labels.join(', ')}`
    );
    const intensity = choice.intensity
      ? INTENSITY_LABELS[choice.intensity]
      : null;

    blocks.push(
      [`[${section.label}]`, intensity, ...lines].filter(Boolean).join('\n')
    );
  }

  return blocks.length > 1 ? blocks.join('\n\n') : null;
};
