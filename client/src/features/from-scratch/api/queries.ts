import { gql } from '@apollo/client';

export interface IScratchReference {
  textId: number;
  artistName: string;
  title: string | null;
}

export interface IScratchResult {
  aiText: string;
  usageId: number;
  references: IScratchReference[];
}

export const WRITE_FROM_SCRATCH = gql`
  mutation WriteFromScratch(
    $theme: String!
    $form: TrackFormQuotas!
    $facets: ScratchFacetsInput
    $references: ReferenceFilterInput
  ) {
    writeFromScratch(
      theme: $theme
      form: $form
      facets: $facets
      references: $references
    ) {
      aiText
      usageId
      references {
        textId
        artistName
        title
      }
    }
  }
`;

export const CREATE_SCRATCH_TRACK_TEXT = gql`
  mutation CreateScratchTrackText(
    $theme: String!
    $aiText: String!
    $usageId: Int
    $generation: String
  ) {
    createScratchTrackText(
      theme: $theme
      aiText: $aiText
      usageId: $usageId
      generation: $generation
    ) {
      id
    }
  }
`;
