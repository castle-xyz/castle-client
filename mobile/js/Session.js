import React, { useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import FastImage from 'react-native-fast-image';
import gql from 'graphql-tag';
import ExpoConstants from 'expo-constants';
import { CastleAsyncStorage } from './common/CastleAsyncStorage';
import { Platform } from 'react-native';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { ApolloLink, Observable } from 'apollo-link';
import { createUploadLink, ReactNativeFile } from 'apollo-upload-client';

import * as Amplitude from 'expo-analytics-amplitude';
import * as Constants from './Constants';
import * as GhostChannels from './ghost/GhostChannels';
import * as LocalId from './common/local-id';
import * as PushNotifications from './PushNotifications';
import * as EventEmitter from './EventEmitter';

let gAuthToken, gUserId;
const TEST_AUTH_TOKEN = null;

const EMPTY_SESSION = {
  authToken: null,
  notifications: null,
  notificationsBadgeCount: 0,
  newFollowingDecks: false,
};

const SessionContext = React.createContext(EMPTY_SESSION);

PushNotifications.addTokenListener(async (token) => {
  if (!gAuthToken) {
    return;
  }

  let platform = await PushNotifications.getPlatformAsync();

  await apolloClient.mutate({
    mutation: gql`
      mutation UpdatePushToken($token: String!, $platform: String!) {
        updatePushToken(token: $token, platform: $platform)
      }
    `,
    variables: { token, platform },
  });
});

export async function loadAuthTokenAsync() {
  if (gAuthToken) {
    return;
  }

  if (TEST_AUTH_TOKEN) {
    gAuthToken = TEST_AUTH_TOKEN;
  } else {
    gAuthToken = await CastleAsyncStorage.getItem('AUTH_TOKEN');
    gUserId = await CastleAsyncStorage.getItem('USER_ID');
    Amplitude.setUserId(gUserId);
  }
}

export class Provider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...EMPTY_SESSION,
      authToken: null,
      isSignedIn: false,
      userId: null,
      initialized: false,
      signInAsync: this.signInAsync,
      signOutAsync: this.signOutAsync,
      signUpAsync: this.signUpAsync,
      markNotificationsReadAsync: this.markNotificationsReadAsync,
      markFollowingFeedRead: this.markFollowingFeedRead,
    };
  }

  async componentDidMount() {
    this._mounted = true;
    if (!this.state.initialized) {
      await loadAuthTokenAsync();

      if (this._mounted) {
        this.setState({
          authToken: gAuthToken,
          isSignedIn: !!gAuthToken,
          userId: gUserId,
          initialized: true,
        });
      }
    }

    this._notificationsListener = EventEmitter.addListener(
      'notifications',
      (notificationsState) => {
        this.setState(notificationsState);
      }
    );
  }

  componentWillUnmount() {
    this._mounted = false;
    EventEmitter.removeListener(this._notificationsListener);
  }

  useNewAuthTokenAsync = async ({ userId, token }) => {
    if (!TEST_AUTH_TOKEN) {
      apolloClient.resetStore();
      gAuthToken = token;
      gUserId = userId;

      if (token) {
        await CastleAsyncStorage.setItem('AUTH_TOKEN', token);
        await CastleAsyncStorage.setItem('USER_ID', userId);
        Amplitude.setUserId(gUserId);
      } else {
        await CastleAsyncStorage.removeItem('AUTH_TOKEN');
        await CastleAsyncStorage.removeItem('USER_ID');
        await PushNotifications.clearTokenAsync();
        Amplitude.setUserId(null);
        Amplitude.clearUserProperties();
      }
    }

    return this.setState({
      authToken: gAuthToken,
      isSignedIn: !!gAuthToken,
      userId: gUserId,
    });
  };

  signInAsync = async ({ username, password }) => {
    const userId = await userIdForUsernameAsync(username);
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation SignIn($userId: ID!, $password: String!) {
          login(userId: $userId, password: $password) {
            userId
            token
            photo {
              url
            }
          }
        }
      `,
      variables: { userId, password },
    });
    if (result && result.data && result.data.login && result.data.login.userId) {
      if (Platform.OS == 'android') {
        try {
          GhostChannels.saveSmartLockCredentials(username, password, result.data.login.photo.url);
        } catch (e) {}
      }

      await this.useNewAuthTokenAsync(result.data.login);
    }
  };

  signOutAsync = async () => {
    await apolloClient.mutate({
      mutation: gql`
        mutation SignOut {
          logout
        }
      `,
    });
    await this.useNewAuthTokenAsync({});
  };

  signUpAsync = async ({ username, name, email, password }) => {
    const result = await apolloClient.mutate({
      mutation: gql`
        mutation SignUp($name: String!, $username: String!, $email: String!, $password: String!) {
          signup(user: { name: $name, username: $username }, email: $email, password: $password) {
            userId
            token
            photo {
              url
            }
          }
        }
      `,
      variables: { username, name, email, password },
    });
    if (result && result.data && result.data.signup && result.data.signup.userId) {
      if (Platform.OS == 'android') {
        try {
          GhostChannels.saveSmartLockCredentials(username, password, result.data.signup.photo.url);
        } catch (e) {}
      }

      await this.useNewAuthTokenAsync(result.data.signup);
    }
  };

  markNotificationsReadAsync = async (opts) => {
    let unreadIds = opts?.unreadIds ?? null;
    if (!unreadIds?.length) {
      // mark all as read if none are specified
      unreadIds = this.state.notifications
        ? this.state.notifications.filter((n) => n.status === 'unseen').map((n) => n.notificationId)
        : null;
      if (!unreadIds?.length) {
        return;
      }
    }
    try {
      await _sendMarkNotificationsRead({ notificationIds: unreadIds });
    } catch (_) {
      console.warn(`Network request to mark notifs read failed, marking locally read anyway`);
    }
    return this.setState((state) => {
      const notifications = state.notifications.map((n) => {
        if (unreadIds.includes(n.notificationId)) {
          return {
            ...n,
            status: 'seen',
          };
        }

        return n;
      });
      return {
        ...state,
        notifications,
      };
    });
  };

  markFollowingFeedRead = () => {
    try {
      // don't await
      _sendMarkFollowingFeedRead();
    } catch (_) {
      console.warn(
        `Network request to mark following feed read failed, marking locally read anyway`
      );
    }
    return this.setState({ newFollowingDecks: false });
  };

  render() {
    return (
      <SessionContext.Provider value={this.state}>{this.props.children}</SessionContext.Provider>
    );
  }
}

export const useSession = () => React.useContext(SessionContext);

// for checking auth state outside of react component tree
export const isSignedIn = () => gAuthToken !== null;

// Based on https://www.apollographql.com/docs/react/migrating/boost-migration/
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) =>
          console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
        );
      }
      if (networkError) {
        console.log(`[Network error]: ${networkError}`);
      }
    }),
    new ApolloLink(
      (operation, forward) =>
        new Observable((observer) => {
          let handle;
          Promise.resolve(operation)
            .then((operation) => {
              const headers = {};
              headers['X-Platform'] = 'mobile';
              headers['X-OS'] = Platform.OS;
              headers['X-Build-Version-Code'] = ExpoConstants.nativeBuildVersion;
              headers['X-Build-Version-Name'] = ExpoConstants.nativeAppVersion;
              if (gAuthToken) {
                headers['X-Auth-Token'] = gAuthToken;
              }
              operation.setContext({ headers });
            })
            .then(() => {
              handle = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            })
            .catch(observer.error.bind(observer));
          return () => {
            if (handle) handle.unsubscribe();
          };
        })
    ),
    createUploadLink({
      uri: 'https://api.castle.xyz/graphql',
    }),
  ]),
  cache: new InMemoryCache({
    cacheRedirects: {
      Query: {
        card: (_, args, { getCacheKey }) => getCacheKey({ __typename: 'Card', id: args.cardId }),
      },
    },
  }),
});

const userIdForUsernameAsync = async (username) => {
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

export const resetPasswordAsync = async ({ username }) => {
  const userId = await userIdForUsernameAsync(username);
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ResetPassword($userId: ID!) {
        sendResetPasswordEmail(userId: $userId)
      }
    `,
    variables: { userId },
  });
  return result;
};

export const CARD_FRAGMENT = `
  id
  cardId
  title
  lastModified
  backgroundImage {
    fileId
    url
  }
  scene {
    data
    sceneId
  }
`;

const DECK_FRAGMENT = `
  id
  deckId
  title
  initialCard {
    id
    cardId
  }
  creator {
    userId
    username
    photo {
      url
    }
  }
  variables
  visibility
  accessPermissions
`;

export const prefetchCardsAsync = async ({ cardId }) => {
  const {
    data: { prefetchCards },
  } = await apolloClient.query({
    query: gql`
      query PrefetchCards($cardId: ID!) {
        prefetchCards(cardId: $cardId) {
          ${CARD_FRAGMENT}
        }
      }
    `,
    variables: { cardId },
  });

  prefetchCards.forEach((card) => {
    if (card.backgroundImage && card.backgroundImage.url) {
      FastImage.preload([{ uri: card.backgroundImage.url }]);
    }
  });
};

async function createNewDestinationCards(deckId, sceneData) {
  // if any 'send player to card' rule has a LocalId destination, save a blank card there
  let actors, data;
  try {
    if (deckId && sceneData) {
      data = JSON.parse(sceneData);
      actors = data.snapshot?.actors;
    }
  } catch (_) {}

  let cardsCreated = [];
  if (actors) {
    for (let ii = 0; ii < actors.length; ii++) {
      const actor = actors[ii];
      const components = actor?.bp?.components;
      if (components && components.Text && components.Rules && components.Rules.rules) {
        for (let jj = 0; jj < components.Rules.rules.length; jj++) {
          const rule = components.Rules.rules[jj];
          if (rule.trigger?.name === 'tap') {
            let response = rule.response;
            while (response && response.params) {
              if (response.name === 'send player to card') {
                const cardId = response.params.card?.cardId;
                if (cardId && LocalId.isLocalId(cardId)) {
                  const result = await apolloClient.mutate({
                    mutation: gql`
                      mutation UpdateDeckAndCard($deck: DeckInput!, $card: CardInput!) {
                        updateCardAndDeckV2(
                          deck: $deck,
                          card: $card,
                        ) {
                          card {
                            ${CARD_FRAGMENT}
                          }
                        }
                      }
                    `,
                    variables: {
                      deck: { deckId },
                      card: { cardId: cardId, blocks: [] },
                    },
                  });
                  const cardCreated = result.data.updateCardAndDeckV2.card;
                  cardsCreated.push(cardCreated);
                  LocalId.setIdIsSaved(cardId);
                }
              }
              response = response.params.nextResponse;
            }
          }
        }
      }
    }
  }
  return cardsCreated;
}

export const saveDeck = async (
  card,
  deck,
  variables,
  isAutosave = false,
  parentCardId = undefined
) => {
  const deckUpdateFragment = {
    deckId: parentCardId ? LocalId.makeId() : deck.deckId,
    title: deck.title,
  };
  const cardUpdateFragment = {
    cardId: parentCardId ? LocalId.makeId() : card.cardId,
    title: card.title,
    backgroundImageFileId: card.backgroundImage ? card.backgroundImage.fileId : undefined,
    sceneData: card.changedSceneData ? card.changedSceneData : card.scene.data,
    blocks: card.blocks
      ? card.blocks.map((block) => {
          return {
            type: block.type,
            destinationCardId: block.destinationCardId,
            title: block.title,
            metadata: block.metadata,
          };
        })
      : [],
    makeInitialCard: card.makeInitialCard || undefined,
  };
  if (variables) {
    deckUpdateFragment.variables = variables;
  }

  const result = await apolloClient.mutate({
    mutation: gql`
        mutation UpdateDeckAndCard(
          $deck: DeckInput!, $card: CardInput!, $isAutosave: Boolean, $parentCardId: ID) {
          updateCardAndDeckV2(
            deck: $deck,
            card: $card,
            isAutosave: $isAutosave,
            parentCardId: $parentCardId,
          ) {
            deck {
              ${DECK_FRAGMENT}
            }
            card {
              ${CARD_FRAGMENT}
            }
          }
        }
      `,
    variables: { deck: deckUpdateFragment, card: cardUpdateFragment, isAutosave, parentCardId },
  });

  let updatedCard = result.data.updateCardAndDeckV2.card;
  let newCards = [...deck.cards];

  // NOTE: if parentCardId was provided, then deck id and card ids all changed.
  // we can get away with not updating the card ids here because when you clone a deck,
  // the app immediately navigates to the new deck overview and re-fetches everything.
  const updatedDeckId = parentCardId ? result.data.updateCardAndDeckV2.deck.deckId : deck.deckId;

  let existingIndex = deck.cards.findIndex((old) => old.cardId === card.cardId);
  if (existingIndex >= 0) {
    newCards[existingIndex] = updatedCard;
  } else {
    newCards.push(updatedCard);
  }

  // mark any local ids as nonlocal
  if (LocalId.isLocalId(updatedCard.cardId)) {
    LocalId.setIdIsSaved(updatedCard.cardId);
  }
  if (LocalId.isLocalId(updatedDeckId)) {
    LocalId.setIdIsSaved(updatedDeckId);
  }

  // create any destination cards marked as 'new' which are referenced by this card
  const cardsCreated = await createNewDestinationCards(updatedDeckId, card.changedSceneData);
  if (cardsCreated) {
    newCards = newCards.concat(cardsCreated);
  }

  return {
    card: updatedCard,
    deck: {
      ...result.data.updateCardAndDeckV2.deck,
      cards: newCards,
    },
  };
};

export const getDeckById = async (deckId) => {
  const result = await apolloClient.query({
    query: gql`
      query GetDeckById($deckId: ID!) {
        deck(deckId: $deckId) {
          ${DECK_FRAGMENT}
          cards {
            ${CARD_FRAGMENT}
          }
        }
      }
    `,
    variables: { deckId },
    fetchPolicy: 'no-cache',
  });
  return result.data.deck;
};

export const getDecksByIds = async (deckIds, fields) => {
  if (!deckIds || !deckIds.length) return [];

  fields =
    fields ??
    `
    ${DECK_FRAGMENT}
    cards {
      ${CARD_FRAGMENT}
    }`;
  if (!deckIds || !deckIds.length) return [];
  let queries = [];
  deckIds.forEach((deckId, ii) => {
    queries.push(`
        deck${ii}: deck(deckId: "${deckId}") {
          ${fields}
        }
    `);
  });
  const result = await apolloClient.query({
    query: gql`
      query {
        ${queries.join('\n')}
      }`,
  });

  if (result && result.data) {
    return Object.entries(result.data).map(([alias, deck]) => deck);
  } else if (result?.errors) {
    throw new Error(`getDecksByIds: ${result.errors[0]}`);
  }
  return [];
};

export const uploadFile = async ({ uri }) => {
  const name = uri.match(/[^/]*$/)[0] || '';
  const extension = name.match(/[^.]*$/)[0] || '';
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation UploadFile($file: Upload!) {
        uploadFile(file: $file) {
          fileId
          url
        }
      }
    `,
    variables: {
      file: new ReactNativeFile({
        uri,
        name,
        type:
          extension === 'jpg'
            ? 'image/jpeg'
            : extension === 'jpg'
            ? 'image/jpeg'
            : extension === 'png'
            ? 'image/png'
            : 'application/octet-stream',
      }),
    },
    fetchPolicy: 'no-cache',
  });
  return result?.data?.uploadFile;
};

export const uploadDeckPreview = async ({ deckId, framePaths }) => {
  const files = framePaths.map((path) => {
    const name = path.match(/[^/]*$/)[0] || '';
    return new ReactNativeFile({
      uri: path,
      name,
      type: 'image/png',
    });
  });
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation UploadDeckPreview($deckId: ID!, $files: [Upload]!) {
        uploadDeckPreview(deckId: $deckId, files: $files) {
          fileId
          url
        }
      }
    `,
    variables: {
      deckId,
      files,
    },
    fetchPolicy: 'no-cache',
  });
  return result?.data?.uploadDeckPreview;
};

export const uploadBase64 = async (data) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation UploadBase64($data: String!, $filename: String, $mimetype: String) {
        uploadBase64(data: $data, filename: $filename, mimetype: $mimetype) {
          fileId
          url
        }
      }
    `,
    variables: {
      data,
      filename: 'screenshot.png',
      mimetype: 'image/png',
    },
    fetchPolicy: 'no-cache',
  });
  return result?.data?.uploadBase64;
};

export const toggleFollowUser = async (userId, follow) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation($userId: ID!, $follow: Boolean!) {
        toggleFollowUser(userId: $userId, follow: $follow) {
          userId
          connections
        }
      }
    `,
    variables: { userId, follow },
  });
  return result?.data?.toggleFollowUser;
};

const _sendMarkFollowingFeedRead = debounce(
  async () =>
    apolloClient.mutate({
      mutation: gql`
        mutation {
          markFollowingFeedRead
        }
      `,
    }),
  100
);

const _sendMarkNotificationsRead = debounce(
  async ({ notificationIds }) =>
    apolloClient.mutate({
      mutation: gql`
        mutation SetNotificationsStatus($notificationIds: [ID]!, $status: NotificationStatus!) {
          setNotificationsStatus(notificationIds: $notificationIds, status: $status)
        }
      `,
      variables: {
        notificationIds,
        status: 'seen',
      },
    }),
  100
);

const NOTIF_FETCH_THRESHOLD_MS = 10 * 60 * 1000;
let notifLastFetchTime;

export const maybeFetchNotificationsAsync = async (force = true) => {
  if (!gAuthToken) {
    return false;
  }

  // This function is called frequently and can result in a lot of unnecessary reloading of the
  // notifs tab. Only refresh if we need to.
  if (!force && notifLastFetchTime && Date.now() - notifLastFetchTime < NOTIF_FETCH_THRESHOLD_MS) {
    return false;
  }

  notifLastFetchTime = Date.now();

  const result = await apolloClient.query({
    query: gql`
    query {
      notificationsV2(limit: 64) {
        newFollowingDecks
        notifications {
          notificationId
          type
          status
          body
          userIds
          users {
            userId
            username
            connections
            photo {
              url
            }
          }
          deckId
          deck {
            ${Constants.FEED_ITEM_DECK_FRAGMENT}
          }
          updatedTime
        }
      }
    }
  `,
    fetchPolicy: 'no-cache',
  });
  const data = result?.data?.notificationsV2 ?? {};
  const { notifications, newFollowingDecks } = data;
  const notificationsBadgeCount = notifications
    ? notifications.reduce((accum, n) => accum + (n.status === 'unseen'), 0)
    : 0;
  PushNotifications.setNewFollowingDecks(newFollowingDecks);

  // This replicates the behavior of setNotifBadge()
  PushNotifications.setBadgeCount(notificationsBadgeCount);
  EventEmitter.sendEvent('notifications', {
    newFollowingDecks,
    notifications,
    notificationsBadgeCount,
  });
};

export const setNotifBadge = (count) => {
  // Sets app badge on iOS + Android and in-app tab badge on Android
  PushNotifications.setBadgeCount(count);

  // Sets in-app tab badge on iOS
  EventEmitter.sendEvent('notifications', {
    notificationsBadgeCount: count,
  });
};
