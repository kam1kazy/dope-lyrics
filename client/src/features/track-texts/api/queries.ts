import { gql } from '@apollo/client';

export interface ITrackTextItem {
  id: number;
  createdAt: string;
  theme: string | null;
  doneAt: string | null;
}

export interface ITrackText extends ITrackTextItem {
  sourceText: string;
  aiText: string;
  text: string;
  finalText: string | null;
}

const TRACK_TEXT_FIELDS = `
  id
  createdAt
  theme
  sourceText
  aiText
  text
  finalText
  doneAt
`;

export const TRACK_TEXTS = gql`
  query TrackTexts {
    trackTexts {
      id
      createdAt
      theme
      doneAt
    }
  }
`;

export const TRACK_TEXT = gql`
  query TrackText($id: Int!) {
    trackText(id: $id) {
      ${TRACK_TEXT_FIELDS}
    }
  }
`;

export const UPDATE_TRACK_TEXT = gql`
  mutation UpdateTrackText($id: Int!, $text: String!) {
    updateTrackText(id: $id, text: $text) {
      ${TRACK_TEXT_FIELDS}
    }
  }
`;

export const MARK_TRACK_TEXT_DONE = gql`
  mutation MarkTrackTextDone($id: Int!) {
    markTrackTextDone(id: $id) {
      ${TRACK_TEXT_FIELDS}
    }
  }
`;
