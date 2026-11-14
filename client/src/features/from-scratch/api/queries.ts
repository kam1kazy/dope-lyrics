import { gql } from '@apollo/client';

export interface IScratchSource {
  textId: number;
  artistName: string;
  title: string | null;
}

export interface IScratchCloseLine {
  /** Номер строки ответа без пустых строк и меток частей, с нуля. */
  line: number;
  sourceLine: string;
  artistName: string;
}

export interface IScratchResult {
  aiText: string;
  usageId: number;
  sources: IScratchSource[];
  collage: string;
  close: IScratchCloseLine[];
}

export const WRITE_FROM_SCRATCH = gql`
  mutation WriteFromScratch(
    $theme: String!
    $form: TrackFormQuotas!
    $facets: ScratchFacetsInput
    $references: ReferenceFilterInput
    $mode: ScratchMode
  ) {
    writeFromScratch(
      theme: $theme
      form: $form
      facets: $facets
      references: $references
      mode: $mode
    ) {
      aiText
      usageId
      sources {
        textId
        artistName
        title
      }
      collage
      close {
        line
        sourceLine
        artistName
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
