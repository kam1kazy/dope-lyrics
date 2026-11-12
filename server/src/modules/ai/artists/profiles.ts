import type { TechniqueKind } from '~/modules/ai/artists/techniques';

export type ArtistTechnique = {
  kind: TechniqueKind;
  label: string;
  instruction: string;
};

/** Текст артиста с полки эталонов и его теги. */
export type ReferenceSample = {
  id: number;
  title: string | null;
  text: string;
  note: string | null;
  mood: readonly string[];
  delivery: readonly string[];
  songRole: readonly string[];
  energy: string | null;
};

/** Карточка артиста с полки пользователя. Тексты — уже с учётом фильтра. */
export type ArtistProfile = {
  id: number;
  name: string;
  moods: readonly string[];
  energies: readonly string[];
  deliveries: readonly string[];
  techniques: readonly ArtistTechnique[];
  texts: readonly ReferenceSample[];
};
