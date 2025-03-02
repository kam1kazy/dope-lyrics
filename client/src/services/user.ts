import { gql } from '@apollo/client';

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    userByEmail(email: $email) {
      id
      name
      email
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $name: String, $email: String) {
    updateUser(id: $id, name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

export const LINK_ACCOUNT = gql`
  mutation LinkAccount($userId: ID!, $provider: String!, $providerAccountId: String!) {
    linkAccount(userId: $userId, provider: $provider, providerAccountId: $providerAccountId) {
      userId
      provider
      providerAccountId
    }
  }
`;

export const GET_USER_BY_ACCOUNT = gql`
  query GetUserByAccount($provider: String!, $providerAccountId: String!) {
    userByAccount(provider: $provider, providerAccountId: $providerAccountId) {
      id
      name
      email
    }
  }
`;
