import type {
  ArtistProfile,
  ArtistTechnique,
  ReferenceSample,
} from '~/modules/ai/artists/profiles';
import type { TechniqueKind } from '~/modules/ai/artists/techniques';

const technique = (kind: TechniqueKind, label: string): ArtistTechnique => ({
  kind,
  label,
  instruction: `инструкция: ${label}`,
});

export const sample = (
  id: number,
  tags: Partial<Omit<ReferenceSample, 'id' | 'text'>> = {}
): ReferenceSample => ({
  id,
  title: tags.title ?? null,
  text: `текст ${id}`,
  note: tags.note ?? null,
  mood: tags.mood ?? [],
  delivery: tags.delivery ?? [],
  songRole: tags.songRole ?? [],
  energy: tags.energy ?? null,
});

const artist = (
  id: number,
  name: string,
  facets: Pick<ArtistProfile, 'moods' | 'energies' | 'deliveries'>,
  techniques: ArtistTechnique[],
  texts: ReferenceSample[] = []
): ArtistProfile => ({ id, name, ...facets, techniques, texts });

/** Маленькая полка для тестов подбора: похожа на стартовые карточки. */
export const TEST_SHELF: readonly ArtistProfile[] = [
  artist(
    1,
    'Future',
    { moods: ['LONGING', 'COLD'], energies: ['EVEN'], deliveries: ['TUNE'] },
    [
      technique('TONE', 'онемение'),
      technique('SOUND', 'автотюн как чувство'),
      technique('IMAGE', 'параноидальная роскошь'),
    ]
  ),
  artist(
    2,
    'MAYOT',
    {
      moods: ['LONGING', 'TENDERNESS'],
      energies: ['QUIET'],
      deliveries: ['TUNE'],
    },
    [
      technique('SOUND', 'мелодичный сленг'),
      technique('WORDPLAY', 'игра на созвучии'),
      technique('IMAGE', 'тихая близость'),
    ]
  ),
  artist(
    3,
    'Slipknot',
    { moods: ['AGGRESSION'], energies: ['SCREAM'], deliveries: ['PUNCH'] },
    [technique('SOUND', 'шёпот и крик'), technique('IMAGE', 'холодный ужас')]
  ),
  artist(
    4,
    'Oxxxymiron',
    { moods: ['IRONY', 'BRAVADO'], energies: ['LOUD'], deliveries: ['FLOW'] },
    [
      technique('WORDPLAY', 'плотная внутренняя рифма'),
      technique('IMAGE', 'мифы'),
    ]
  ),
];
