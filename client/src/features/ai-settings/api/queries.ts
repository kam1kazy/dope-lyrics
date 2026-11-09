import { gql } from '@apollo/client';

export interface IAiPromptVersion {
  id: number;
  text: string;
  createdAt: string;
}

export interface IAiUsagePeriod {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costRub: number | null;
}

export interface IAiUsageSummary {
  today: IAiUsagePeriod;
  month: IAiUsagePeriod;
  all: IAiUsagePeriod;
}

export interface IAiUsageItem {
  id: number;
  createdAt: string;
  kind: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costRub: number | null;
  latencyMs: number;
  status: 'OK' | 'ERROR';
  error: string | null;
}

export const AI_SETTINGS = gql`
  query AiSettings {
    aiStatus {
      enabled
    }
    aiPrompt {
      id
      text
      createdAt
    }
    aiPromptVersions {
      id
      text
      createdAt
    }
    aiUsageSummary {
      today {
        requests
        tokensIn
        tokensOut
        costRub
      }
      month {
        requests
        tokensIn
        tokensOut
        costRub
      }
      all {
        requests
        tokensIn
        tokensOut
        costRub
      }
    }
    aiUsageRecent {
      id
      createdAt
      kind
      model
      tokensIn
      tokensOut
      costRub
      latencyMs
      status
      error
    }
  }
`;

export const SAVE_AI_PROMPT = gql`
  mutation SaveAiPrompt($text: String!) {
    saveAiPrompt(text: $text) {
      id
      text
      createdAt
    }
  }
`;
