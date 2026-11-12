import { requireAi } from '~/graphql/ai.resolvers';
import { draftArtistCard } from '~/modules/ai/references/card';
import { tagReferenceText } from '~/modules/ai/references/tags';
import {
  type ArtistInput,
  createArtist,
  createReferenceText,
  deleteArtist,
  deleteReferenceText,
  getArtist,
  listArtists,
  type ReferenceTextInput,
  updateArtist,
  updateReferenceText,
} from '~/modules/references/references.service';

import type { GraphQLContext } from './context';

type TextRow = {
  id: number;
  artistId: number;
  title: string | null;
  text: string;
  note: string | null;
  mood: string[];
  delivery: string[];
  songRole: string[];
  energy: string | null;
  taggedAt: Date | null;
  createdAt: Date;
};

export const referenceTextDto = (row: TextRow) => ({
  id: row.id,
  artistId: row.artistId,
  title: row.title,
  text: row.text,
  note: row.note,
  mood: row.mood,
  delivery: row.delivery,
  songRole: row.songRole,
  energy: row.energy,
  tagged: row.taggedAt !== null,
  createdAt: row.createdAt.toISOString(),
});

const artistDto = (row: Awaited<ReturnType<typeof getArtist>>) => ({
  id: row.id,
  name: row.name,
  moods: row.moods,
  energies: row.energies,
  deliveries: row.deliveries,
  techniques: row.techniques.map((item) => ({
    id: item.id,
    kind: item.kind,
    label: item.label,
    instruction: item.instruction,
  })),
  texts: row.texts.map(referenceTextDto),
  textCount: row.texts.length,
});

export const referenceQueryResolvers = {
  artists: async (_parent: unknown, _args: unknown, context: GraphQLContext) =>
    (await listArtists(requireAi(context).id)).map(artistDto),
  artist: async (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => artistDto(await getArtist(requireAi(context).id, args.id)),
};

export const referenceMutationResolvers = {
  createArtist: async (
    _parent: unknown,
    args: { name: string },
    context: GraphQLContext
  ) => artistDto(await createArtist(requireAi(context).id, args.name)),
  updateArtist: async (
    _parent: unknown,
    args: { id: number; input: ArtistInput },
    context: GraphQLContext
  ) =>
    artistDto(await updateArtist(requireAi(context).id, args.id, args.input)),
  deleteArtist: (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => deleteArtist(requireAi(context).id, args.id),
  createReferenceText: async (
    _parent: unknown,
    args: { artistId: number; title?: string | null; text: string },
    context: GraphQLContext
  ) => referenceTextDto(await createReferenceText(requireAi(context).id, args)),
  updateReferenceText: async (
    _parent: unknown,
    args: { id: number; input: ReferenceTextInput },
    context: GraphQLContext
  ) =>
    referenceTextDto(
      await updateReferenceText(requireAi(context).id, args.id, args.input)
    ),
  deleteReferenceText: (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => deleteReferenceText(requireAi(context).id, args.id),
  draftArtistCard: (
    _parent: unknown,
    args: { id: number; name: string },
    context: GraphQLContext
  ) => draftArtistCard(requireAi(context).id, args.id, args.name),
  tagReferenceText: async (
    _parent: unknown,
    args: { id: number },
    context: GraphQLContext
  ) => referenceTextDto(await tagReferenceText(requireAi(context).id, args.id)),
};
