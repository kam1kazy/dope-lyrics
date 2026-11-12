import { GraphQLError } from 'graphql';
import { z } from 'zod';

import {
  isTechniqueKind,
  TECHNIQUE_LIMIT,
  type TechniqueKind,
} from '~/modules/ai/artists/techniques';
import { callModel } from '~/modules/ai/model/model-call';
import {
  AiProviderError,
  isAiConfigured,
} from '~/modules/ai/model/polza.client';
import {
  clipLines,
  FACET_VOCABULARY,
  keepKnown,
  parseModelJson,
} from '~/modules/ai/references/vocabulary';
import {
  isLyricDelivery,
  isLyricEnergy,
  isLyricMood,
} from '~/modules/lyrics/lyric-facets';
import { getArtist } from '~/modules/references/references.service';

export const ARTIST_CARD_FRAME_VERSION = '1.0.1';

const SAMPLE_LIMIT = 3;
const SAMPLE_LINES = 16;
const FORMAT_ERROR = 'ИИ вернул карточку в неожиданном формате';

const ARTIST_CARD_SYSTEM = [
  'Ты составляешь карточку артиста для ИИ-редактора рэп-текстов. Автор пишет по-русски.',
  'По результатам поиска и текстам артиста (если даны) опиши, как он пишет: настроение, энергия, подача и приёмы.',
  '',
  'Верни только JSON:',
  '{"name": "...", "moods": [...], "energies": [...], "deliveries": [...], "techniques": [{"kind": "...", "label": "...", "instruction": "..."}]}',
  '',
  '- name — имя так, как оно записано на стриминговых площадках (Яндекс Музыка, Spotify, Apple Music): регистр, точки, латиница или кириллица. Бери написание из результатов поиска, а не как его ввёл автор.',
  '- moods — 1–3 кода настроения, energies — 1–2 кода энергии, deliveries — 1–3 кода подачи. Только коды из словаря ниже.',
  `- techniques — от 3 до ${TECHNIQUE_LIMIT} приёмов, по которым узнаётся артист. kind: IMAGE — образ, SOUND — звук и подача голоса, WORDPLAY — игра слов, TONE — тон и форма. Хотя бы по одному IMAGE, SOUND и WORDPLAY.`,
  '- label — ярлык приёма, 2–5 слов по-русски, строчными.',
  '- instruction — одна-две короткие фразы по-русски: что сделать со строкой, и чего не делать. Повелительно, без имени артиста и без цитат его строк.',
  '- Не выдумывай: если про артиста мало данных, бери то, что видно в его текстах.',
  '',
  FACET_VOCABULARY,
].join('\n');

const techniqueSchema = z.object({
  kind: z.string(),
  label: z.string().trim().min(1).max(80),
  instruction: z.string().trim().min(1).max(500),
});

const cardSchema = z.object({
  name: z.string().trim().min(1).max(80),
  moods: z.array(z.unknown()).optional(),
  energies: z.array(z.unknown()).optional(),
  deliveries: z.array(z.unknown()).optional(),
  techniques: z.array(z.unknown()).optional(),
});

export type ArtistCardDraft = {
  name: string;
  moods: string[];
  energies: string[];
  deliveries: string[];
  techniques: { kind: TechniqueKind; label: string; instruction: string }[];
};

export const parseArtistCard = (raw: string): ArtistCardDraft => {
  const parsed = cardSchema.safeParse(parseModelJson(raw, FORMAT_ERROR));

  if (!parsed.success) {
    throw new AiProviderError(FORMAT_ERROR);
  }

  const techniques = (parsed.data.techniques ?? [])
    .map((item) => techniqueSchema.safeParse(item))
    .flatMap((item) =>
      item.success && isTechniqueKind(item.data.kind)
        ? [{ ...item.data, kind: item.data.kind }]
        : []
    )
    .slice(0, TECHNIQUE_LIMIT);

  return {
    name: parsed.data.name,
    moods: keepKnown(parsed.data.moods, isLyricMood),
    energies: keepKnown(parsed.data.energies, isLyricEnergy),
    deliveries: keepKnown(parsed.data.deliveries, isLyricDelivery),
    techniques,
  };
};

export const buildArtistCardUser = (
  name: string,
  samples: readonly { title: string | null; text: string }[]
): string => {
  const parts = [`Артист: ${name}`];

  if (samples.length > 0) {
    parts.push(
      'Тексты артиста с полки автора:',
      ...samples.map(
        (item, index) =>
          `Текст ${index + 1}${item.title ? ` — «${item.title}»` : ''}\n${clipLines(item.text, SAMPLE_LINES)}`
      )
    );
  }

  return parts.join('\n\n');
};

/** Черновик карточки: в базу не пишется, его сохраняет автор. */
export const draftArtistCard = async (
  userId: number,
  artistId: number,
  rawName: string
): Promise<ArtistCardDraft> => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const name = rawName.replace(/\s+/g, ' ').trim();
  if (!name) {
    throw new GraphQLError('Сначала напишите имя артиста');
  }

  const artist = await getArtist(userId, artistId);
  const { value } = await callModel(
    {
      userId,
      kind: 'ARTIST_CARD',
      frameVersion: ARTIST_CARD_FRAME_VERSION,
      promptId: null,
      system: ARTIST_CARD_SYSTEM,
      user: buildArtistCardUser(name, artist.texts.slice(0, SAMPLE_LIMIT)),
      maxTokens: 1500,
      webSearch: { query: `${name} рэп исполнитель стиль подача тексты` },
    },
    parseArtistCard
  );

  return value;
};
