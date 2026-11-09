import { gql } from '@apollo/client';

export interface IAiPromptVersion {
  id: number;
  number: number;
  text: string;
  name: string | null;
  description: string | null;
  createdAt: string;
}

export interface IAiPromptMeta {
  name: string;
  description: string;
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
      number
      text
      name
      description
      createdAt
    }
    aiPromptVersions {
      id
      number
      text
      name
      description
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

export const CREATE_AI_PROMPT = gql`
  mutation CreateAiPrompt(
    $text: String!
    $name: String!
    $description: String!
  ) {
    createAiPrompt(text: $text, name: $name, description: $description) {
      id
    }
  }
`;

export const SUGGEST_AI_PROMPT_META = gql`
  mutation SuggestAiPromptMeta($text: String!) {
    suggestAiPromptMeta(text: $text) {
      name
      description
    }
  }
`;
