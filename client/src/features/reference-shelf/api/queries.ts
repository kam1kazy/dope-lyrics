import { gql } from '@apollo/client';

export type TechniqueKind = 'IMAGE' | 'SOUND' | 'WORDPLAY' | 'TONE';

export interface IArtistTechnique {
  kind: TechniqueKind;
  label: string;
  instruction: string;
}

export interface IReferenceText {
  id: number;
  artistId: number;
  title: string | null;
  text: string;
  note: string | null;
  mood: string[];
  delivery: string[];
  songRole: string[];
  energy: string | null;
  tagged: boolean;
  createdAt: string;
}

export interface IArtist {
  id: number;
  name: string;
  moods: string[];
  energies: string[];
  deliveries: string[];
  techniques: (IArtistTechnique & { id: number })[];
  texts: IReferenceText[];
  textCount: number;
}

export interface IArtistListItem {
  id: number;
  name: string;
  textCount: number;
  texts: Pick<IReferenceText, 'id' | 'artistId' | 'title' | 'text'>[];
}

export interface IArtistCardDraft {
  name: string;
  moods: string[];
  energies: string[];
  deliveries: string[];
  techniques: IArtistTechnique[];
}

const TEXT_FIELDS = `
  id
  artistId
  title
  text
  note
  mood
  delivery
  songRole
  energy
  tagged
  createdAt
`;

const ARTIST_FIELDS = `
  id
  name
  moods
  energies
  deliveries
  textCount
  techniques {
    id
    kind
    label
    instruction
  }
  texts {
    ${TEXT_FIELDS}
  }
`;

export const ARTISTS = gql`
  query Artists {
    artists {
      id
      name
      textCount
      texts {
        id
        artistId
        title
        text
      }
    }
  }
`;

export const ARTIST = gql`
  query Artist($id: Int!) {
    artist(id: $id) {
      ${ARTIST_FIELDS}
    }
    aiStatus {
      enabled
    }
  }
`;

export const CREATE_ARTIST = gql`
  mutation CreateArtist($name: String!) {
    createArtist(name: $name) {
      ${ARTIST_FIELDS}
    }
  }
`;

export const UPDATE_ARTIST = gql`
  mutation UpdateArtist($id: Int!, $input: ArtistInput!) {
    updateArtist(id: $id, input: $input) {
      ${ARTIST_FIELDS}
    }
  }
`;

export const DELETE_ARTIST = gql`
  mutation DeleteArtist($id: Int!) {
    deleteArtist(id: $id)
  }
`;

export const DRAFT_ARTIST_CARD = gql`
  mutation DraftArtistCard($id: Int!, $name: String!) {
    draftArtistCard(id: $id, name: $name) {
      name
      moods
      energies
      deliveries
      techniques {
        kind
        label
        instruction
      }
    }
  }
`;

export const CREATE_REFERENCE_TEXT = gql`
  mutation CreateReferenceText($artistId: Int!, $title: String, $text: String!) {
    createReferenceText(artistId: $artistId, title: $title, text: $text) {
      ${TEXT_FIELDS}
    }
  }
`;

export const UPDATE_REFERENCE_TEXT = gql`
  mutation UpdateReferenceText($id: Int!, $input: ReferenceTextInput!) {
    updateReferenceText(id: $id, input: $input) {
      ${TEXT_FIELDS}
    }
  }
`;

export const DELETE_REFERENCE_TEXT = gql`
  mutation DeleteReferenceText($id: Int!) {
    deleteReferenceText(id: $id)
  }
`;

export const TAG_REFERENCE_TEXT = gql`
  mutation TagReferenceText($id: Int!) {
    tagReferenceText(id: $id) {
      ${TEXT_FIELDS}
    }
  }
`;
