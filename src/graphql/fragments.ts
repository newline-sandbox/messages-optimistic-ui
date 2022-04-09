import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query {
    users {
      id
      firstName
      lastName
    }
  }
`;

export const GET_MESSAGES = gql`
  query {
    messages {
      id
      text
      createdBy {
        id
        firstName
        lastName
      }
      createdAt
    }
  }
`;

export const ADD_MESSAGE = gql`
  mutation AddMessage(
    $text: String!
    $userId: ID!
    $isRetry: Boolean
    $createdAt: String
  ) {
    addMessage(
      text: $text
      userId: $userId
      isRetry: $isRetry
      createdAt: $createdAt
    ) {
      id
      text
      createdBy {
        id
        firstName
        lastName
      }
      createdAt
    }
  }
`;

export const CACHE_NEW_MESSAGE_FRAGMENT = gql`
  fragment NewMessage on Message {
    id
    text
    createdBy {
      id
      firstName
      lastName
    }
    createdAt
  }
`;
