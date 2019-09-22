import { AsyncStorage } from 'react-native';
import ApolloClient, { gql } from 'apollo-boost';
export { ApolloConsumer, Query, Mutation } from 'react-apollo';

import { onApolloClientChanged } from './Main';

export { gql };

export let apolloClient = null;

export let authToken = null;

export async function initAsync(token) {
  authToken = token;

  if (token) {
    await AsyncStorage.setItem('authToken', token);
  }

  apolloClient = new ApolloClient({
    uri: 'https://api.castle.games/graphql',
    headers: token ? {
      ['X-Auth-Token']: token,
    } : {},
  });
  onApolloClientChanged(apolloClient);
}

export function isSignedInAsync() {
  return !!authToken;
}
