import { gql } from '@apollo/client';

export const CREATE_SESSION = gql`
  mutation CreateSession($sessionToken: String!, $userId: ID!, $expires: DateTime!) {
    createSession(sessionToken: $sessionToken, userId: $userId, expires: $expires) {
      id
      name
      email
    }
  }
`;

export const DELETE_SESSION = gql`
  mutation DeleteSession($sessionToken: String!) {
    deleteSession(sessionToken: $sessionToken) {
      id
      name
      email
    }
  }
`;

export const REVOKE_TOKEN = gql`
  mutation RevokeToken($refreshToken: String!) {
    revokeToken(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

export const GET_SESSION_AND_USER = gql`
  query GetSessionAndUser($sessionToken: String!) {
    getSessionAndUser(sessionToken: $sessionToken) {
      id
      name
      email
    }
  }
`;

export const UPDATE_SESSION = gql`
  mutation UpdateSession($sessionToken: String!, $expires: DateTime) {
    updateSession(sessionToken: $sessionToken, expires: $expires) {
      id
      name
      email
    }
  }
`;





