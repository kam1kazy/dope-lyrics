import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation createUser($email: String!, $password: String!, $name: String!) {
    createUser(email: $email, password: $password, name: $name) {
      id
      email
      name
      role
      refreshToken
      sessionToken
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      name
      email
      role
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;
