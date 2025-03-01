import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($email: String!, $password: String!, $name: String!) {
    createUser(email: $email, password: $password, name: $name) {
      id
      email
      name
      role
      createdAt
      updatedAt
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
      createdAt
      updatedAt
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      role
      createdAt
      updatedAt
    }
  }
`;