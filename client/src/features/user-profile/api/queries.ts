import { gql } from '@apollo/client';

export type UserRole = 'OWNER' | 'ADMIN' | 'USER';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Админ',
  USER: 'Пользователь',
};

export type IngestSourceKind = 'MAIN' | 'CHANNEL';
export type IngestSourceState = 'READY' | 'UNAVAILABLE' | 'ERROR';

export interface IProfile {
  id: number;
  username: string;
  role: UserRole;
}

export interface IIngestSource {
  key: string;
  title: string;
  kind: IngestSourceKind;
  state: IngestSourceState;
  pendingCount: number;
}

export interface IInvite {
  id: number;
  createdAt: string;
  expiresAt: string;
}

export interface ICreatedInvite {
  code: string;
  expiresAt: string;
}

export const PROFILE = gql`
  query Profile {
    profile {
      id
      username
      role
    }
  }
`;

export const INGEST_SOURCES = gql`
  query IngestSources {
    ingestSources {
      key
      title
      kind
      state
      pendingCount
    }
  }
`;

export const INGEST_SOURCE = gql`
  mutation IngestSource($key: String!) {
    ingestSource(key: $key) {
      ok
      addedCount
    }
  }
`;

export const MY_INVITES = gql`
  query MyInvites {
    myInvites {
      id
      createdAt
      expiresAt
    }
  }
`;

export const CREATE_INVITE = gql`
  mutation CreateInvite {
    createInvite {
      code
      expiresAt
    }
  }
`;

export const REVOKE_INVITE = gql`
  mutation RevokeInvite($id: Int!) {
    revokeInvite(id: $id)
  }
`;
