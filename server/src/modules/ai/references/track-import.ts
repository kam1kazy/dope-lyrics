import type { Artist } from '~/generated/prisma/client';
import { tagReferenceText } from '~/modules/ai/references/tags';
import {
  fetchPopularTrackTitles as fetchTitlesFromWeb,
  fetchTrackLyrics,
  LyricsSourceError,
} from '~/modules/references/lyrics-sources';
import {
  createReferenceText,
  type ReferenceTags,
  saveReferenceTags,
} from '~/modules/references/references.service';

export type ImportedTrack = {
  title: string;
  text: string;
  tags: ReferenceTags;
};

export type ImportTrackOptions = {
  tagWithAi: boolean;
  fallbackTags?: ReferenceTags;
};

export const tagsFromArtistCard = (artist: Artist): ReferenceTags => ({
  mood: artist.moods.slice(0, 3),
  delivery: artist.deliveries.slice(0, 3),
  songRole: ['VERSE'],
  energy: artist.energies[0] ?? null,
});

export const fetchPopularTrackTitles = (
  artistName: string,
  limit: number
): Promise<string[]> => fetchTitlesFromWeb(artistName, limit);

export const importOneReferenceTrack = async (
  userId: number,
  artist: Artist,
  trackTitle: string,
  options: ImportTrackOptions
): Promise<ImportedTrack> => {
  let lyrics: { title: string; text: string };

  try {
    lyrics = await fetchTrackLyrics(userId, artist.name, trackTitle);
  } catch (error: unknown) {
    if (error instanceof LyricsSourceError) {
      throw error;
    }

    throw new LyricsSourceError(
      error instanceof Error ? error.message : 'Не удалось скачать текст'
    );
  }

  const row = await createReferenceText(userId, {
    artistId: artist.id,
    title: lyrics.title,
    text: lyrics.text,
  });

  if (options.tagWithAi) {
    try {
      const tagged = await tagReferenceText(userId, row.id);
      return {
        title: tagged.title ?? lyrics.title,
        text: tagged.text,
        tags: {
          mood: tagged.mood,
          delivery: tagged.delivery,
          songRole: tagged.songRole,
          energy: tagged.energy,
        },
      };
    } catch {
      if (!options.fallbackTags) {
        throw new LyricsSourceError('Текст сохранён, теги ИИ не поставились');
      }
    }
  }

  const tags = options.fallbackTags ?? tagsFromArtistCard(artist);
  const tagged = await saveReferenceTags(userId, row.id, tags);

  return {
    title: tagged.title ?? lyrics.title,
    text: tagged.text,
    tags: {
      mood: tagged.mood,
      delivery: tagged.delivery,
      songRole: tagged.songRole,
      energy: tagged.energy,
    },
  };
};
