import { GraphQLError } from 'graphql';
import { z } from 'zod';

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
  isLyricSongRole,
} from '~/modules/lyrics/lyric-facets';
import {
  getReferenceText,
  type ReferenceTags,
  saveReferenceTags,
} from '~/modules/references/references.service';

export const REFERENCE_TAGS_FRAME_VERSION = '1.0.0';

const TEXT_LINES = 60;
const FORMAT_ERROR = 'ИИ вернул теги в неожиданном формате';

const REFERENCE_TAGS_SYSTEM = [
  'Ты размечаешь рэп-текст тегами из словаря — так же, как автор размечает свои заметки.',
  'Верни только JSON: {"mood": [...], "delivery": [...], "songRole": [...], "energy": "..."}.',
  '- mood — 1–3 кода, delivery — 1–3 кода, songRole — 1–2 кода (какой частью трека текст звучит), energy — один код.',
  '- Только коды из словаря. Сомневаешься — меньше тегов, а не больше.',
  '',
  FACET_VOCABULARY,
].join('\n');

const tagsSchema = z.object({
  mood: z.array(z.unknown()).optional(),
  delivery: z.array(z.unknown()).optional(),
  songRole: z.array(z.unknown()).optional(),
  energy: z.unknown().optional(),
});

export const parseReferenceTagsReply = (raw: string): ReferenceTags => {
  const parsed = tagsSchema.safeParse(parseModelJson(raw, FORMAT_ERROR));

  if (!parsed.success) {
    throw new AiProviderError(FORMAT_ERROR);
  }

  const energy = parsed.data.energy;

  return {
    mood: keepKnown(parsed.data.mood, isLyricMood),
    delivery: keepKnown(parsed.data.delivery, isLyricDelivery),
    songRole: keepKnown(parsed.data.songRole, isLyricSongRole),
    energy: typeof energy === 'string' && isLyricEnergy(energy) ? energy : null,
  };
};

export const tagReferenceText = async (userId: number, id: number) => {
  if (!isAiConfigured()) {
    throw new GraphQLError('ИИ не настроен');
  }

  const row = await getReferenceText(userId, id);
  const { value } = await callModel(
    {
      userId,
      kind: 'REFERENCE_TAGS',
      frameVersion: REFERENCE_TAGS_FRAME_VERSION,
      promptId: null,
      system: REFERENCE_TAGS_SYSTEM,
      user: `Артист: ${row.artist.name}\n\n${clipLines(row.text, TEXT_LINES)}`,
      maxTokens: 300,
    },
    parseReferenceTagsReply
  );

  return saveReferenceTags(userId, id, value);
};
