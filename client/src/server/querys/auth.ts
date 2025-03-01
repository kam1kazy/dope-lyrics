// server/querys/auth.ts
import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      id
      email
      name
      role
      createdAt
      updatedAt
      token
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
      token
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