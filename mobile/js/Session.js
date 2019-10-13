// Maintains session state for the API server connection -- auth token and GraphQL client

import AsyncStorage from '@react-native-community/async-storage';
import ApolloClient from 'apollo-boost';
import gql from 'graphql-tag';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';

let authToken = null;

export const getAuthToken = () => authToken;

export const apolloClient = new ApolloClient({
  uri: 'https://api.castle.games/graphql',
  request: operation => {
    operation.setContext({
      headers: authToken ? { ['X-Auth-Token']: authToken } : {},
    });
  },
  cache: new InMemoryCache({
    fragmentMatcher: new IntrospectionFragmentMatcher({
      introspectionQueryResultData: {
        __schema: {
          types: [],
        },
      },
    }),
    dataIdFromObject: o => {
      switch (o.__typename) {
        case 'Game':
          return o.gameId || o.id;
        case 'User':
          return o.userId || o.id;
        case 'HostedFile':
          return o.fileId || o.id;
        case 'Post':
          return o.postId || o.id;
        case 'ChatChannel':
          return o.chatChannelId || o.id;
        case 'ChatMessage':
          return o.chatMessageId || o.id;
        default:
          return o.id;
      }
    },
    cacheRedirects: {
      Query: {
        game: (_, args, { getCacheKey }) => getCacheKey({ __typename: 'Game', id: args.gameId }),
        user: (_, args, { getCacheKey }) => getCacheKey({ __typename: 'User', id: args.userId }),
      },
    },
  }),
});

export const initAsync = async () => {
  authToken = await AsyncStorage.getItem('AUTH_TOKEN');
};

export const isSignedIn = () => authToken !== null;

const useNewAuthTokenAsync = async newAuthToken => {
  apolloClient.resetStore();
  authToken = newAuthToken;
  await AsyncStorage.setItem('AUTH_TOKEN', authToken);
};

const userIdForUsernameAsync = async username => {
  const {
    data: {
      userForLoginInput: { userId },
    },
  } = await apolloClient.query({
    query: gql`
      query GetUserId($username: String!) {
        userForLoginInput(who: $username) {
          userId
        }
      }
    `,
    variables: { username },
  });
  return userId;
};

export const signInAsync = async ({ username, password }) => {
  const userId = await userIdForUsernameAsync(username);

  const result = await apolloClient.mutate({
    mutation: gql`
      mutation SignIn($userId: ID!, $password: String!) {
        login(userId: $userId, password: $password) {
          userId
          token
        }
      }
    `,
    variables: { userId, password },
  });
  if (result && result.data && result.data.login && result.data.login.userId) {
    await useNewAuthTokenAsync(result.data.login.token);
  }
};

export const signUpAsync = async ({ username, name, email, password }) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation($name: String!, $username: String!, $email: String!, $password: String!) {
        signup(user: { name: $name, username: $username }, email: $email, password: $password) {
          userId
          token
        }
      }
    `,
    variables: { username, name, email, password },
  });
  if (result && result.data && result.data.signup && result.data.signup.userId) {
    await useNewAuthTokenAsync(result.data.signup.token);
  }
};
