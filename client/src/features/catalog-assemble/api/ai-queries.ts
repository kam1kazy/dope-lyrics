import { gql } from '@apollo/client';

export interface ICollageRewrite {
  sourceText: string;
  aiText: string;
  usageId: number;
}

export const AI_STATUS = gql`
  query AiStatus {
    aiStatus {
      enabled
    }
  }
`;

export const REWRITE_COLLAGE = gql`
  mutation RewriteCollage(
    $slots: [CollageSlotInput!]!
    $theme: String
    $filter: LyricPoolFilter
    $hideAdlibs: Boolean
  ) {
    rewriteCollage(
      slots: $slots
      theme: $theme
      filter: $filter
      hideAdlibs: $hideAdlibs
    ) {
      sourceText
      aiText
      usageId
    }
  }
`;

export const CREATE_TRACK_TEXT = gql`
  mutation CreateTrackText(
    $slots: [CollageSlotInput!]!
    $theme: String
    $aiText: String
    $usageId: Int
    $hideAdlibs: Boolean
  ) {
    createTrackText(
      slots: $slots
      theme: $theme
      aiText: $aiText
      usageId: $usageId
      hideAdlibs: $hideAdlibs
    ) {
      id
    }
  }
`;
