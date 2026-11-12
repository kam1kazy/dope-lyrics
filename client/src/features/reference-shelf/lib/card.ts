import type { IArtist, IArtistTechnique, TechniqueKind } from '../api/queries';

export const TECHNIQUE_KINDS: readonly TechniqueKind[] = [
  'IMAGE',
  'SOUND',
  'WORDPLAY',
  'TONE',
];

export const TECHNIQUE_KIND_LABELS: Record<TechniqueKind, string> = {
  IMAGE: 'образ',
  SOUND: 'звук',
  WORDPLAY: 'игра слов',
  TONE: 'тон',
};

export const TECHNIQUE_KIND_HINTS: Record<TechniqueKind, string> = {
  IMAGE: 'Картинка и детали строки.',
  SOUND: 'Звук, распев, подача голоса.',
  WORDPLAY: 'Игра слов, двойной смысл, панч.',
  TONE: 'Тон и форма. В правку склейки не уходит.',
};

export const TECHNIQUE_LIMIT = 5;

export type ArtistCardForm = {
  name: string;
  moods: string[];
  energies: string[];
  deliveries: string[];
  techniques: IArtistTechnique[];
};

export const cardFormFromArtist = (artist: IArtist): ArtistCardForm => ({
  name: artist.name,
  moods: artist.moods,
  energies: artist.energies,
  deliveries: artist.deliveries,
  techniques: artist.techniques.map(({ kind, label, instruction }) => ({
    kind,
    label,
    instruction,
  })),
});

/** Только значения из словаря, в его порядке. */
export const pickKnown = <T extends string>(
  values: readonly string[],
  options: readonly T[]
): T[] => options.filter((option) => values.includes(option));

export const sameCardForm = (left: ArtistCardForm, right: ArtistCardForm) =>
  JSON.stringify(left) === JSON.stringify(right);
