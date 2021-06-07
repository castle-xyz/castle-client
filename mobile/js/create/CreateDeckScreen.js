import React from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { CardsSet } from '../components/CardsSet';
import { DeckSettingsSheet } from './DeckSettingsSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { SheetBackgroundOverlay } from '../components/SheetBackgroundOverlay';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigation, useFocusEffect } from '../ReactNavigation';
import { useActionSheet } from '@expo/react-native-action-sheet';

import * as Amplitude from 'expo-analytics-amplitude';
import * as LocalId from '../common/local-id';
import * as Session from '../Session';
import * as Utilities from '../common/utilities';

import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  layoutPicker: {
    flexDirection: 'row',
  },
  layoutButton: {
    margin: 6,
  },
  playCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  playCountLabel: {
    color: '#888',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  addCardIcon: {
    height: 48,
    width: 48,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 24,
  },
});

const DECK_FRAGMENT = `
  id
  deckId
  title
  creator {
    userId
    username
    photo {
      url
    }
  }
  visibility
  playCount
  accessPermissions
  commentsEnabled
  parentDeckId
  parentDeck {
    creator { username }
    initialCard {
      backgroundImage { url }
    }
  }
  previewVideo { url }
  cards {
    id
    cardId
    title
    lastModified
    backgroundColor
    backgroundImage {
      url
      smallUrl
    }
    scene {
      data
      sceneId
    }
  }
  initialCard {
    id
    cardId
  }
`;

const CREATE_DECK_VIEW_MODE_KEY = `CreateDeckViewMode`;

const setViewModePreference = async (deckId, mode) => {
  if (!deckId || !mode) return;

  let preferences = await AsyncStorage.getItem(CREATE_DECK_VIEW_MODE_KEY);
  preferences = preferences ?? '{}';
  preferences = JSON.parse(preferences);
  preferences[deckId] = mode;
  return AsyncStorage.setItem(CREATE_DECK_VIEW_MODE_KEY, JSON.stringify(preferences));
};

const getViewModePreference = async (deckId) => {
  if (!deckId) return 'carousel';

  let preferences = await AsyncStorage.getItem(CREATE_DECK_VIEW_MODE_KEY);
  preferences = preferences ?? '{}';
  preferences = JSON.parse(preferences);
  const preference = preferences[deckId];
  return preference ?? 'carousel';
};

export const CreateDeckScreen = (props) => {
  let lastFocusedTime;
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const deckId = props.route.params.deckIdToEdit;
  const [deck, setDeck] = React.useState(null);
  const [settingsSheetVisible, setSettingsSheetVisible] = React.useState(false);
  const [viewMode, setViewMode] = React.useReducer((state, action) => {
    const { mode, deckId } = action;
    if (deckId) {
      setViewModePreference(deckId, mode);
    }
    return mode;
  }, 'carousel');

  if (!deckId || LocalId.isLocalId(deckId)) {
    throw new Error(`CreateDeckScreen requires an existing deck id`);
  }

  const [saveDeck] = useMutation(
    gql`
      mutation UpdateDeck($deck: DeckInput!) {
        updateDeckV2(deck: $deck) {
          ${DECK_FRAGMENT}
        }
      }
    `
  );

  const [deleteDeck] = useMutation(
    gql`
      mutation DeleteDeck($deckId: ID!) {
        deleteDeck(deckId: $deckId)
      }
    `
  );

  const [deleteCard] = useMutation(
    gql`
      mutation DeleteCard($cardId: ID!) {
        deleteCard(cardId: $cardId)
      }
    `
  );

  const [duplicateCard] = useMutation(
    gql`
      mutation DuplicateCard($cardId: ID!) {
        duplicateCard(cardId: $cardId) {
          ${Session.CARD_FRAGMENT}
        }
      }`
  );

  const loadDeck = useQuery(
    gql`
      query Deck($deckId: ID!) {
        deck(deckId: $deckId) {
          ${DECK_FRAGMENT}
        }
      }
    `,
    { variables: { deckId }, fetchPolicy: 'no-cache' }
  );

  const _maybeSaveDeck = async () => {
    if (deck && deck.isChanged) {
      const deckUpdateFragment = {
        deckId,
        title: deck.title,
        // visibility: deck.visibility,
        accessPermissions: deck.accessPermissions,
      };
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, isChanged: false });
    }
  };

  const openSettingsSheet = React.useCallback(() => setSettingsSheetVisible(true), []);
  const closeSettingsSheet = React.useCallback(() => {
    _maybeSaveDeck();
    setSettingsSheetVisible(false);
  }, [_maybeSaveDeck]);

  // kludge for https://github.com/apollographql/react-apollo/issues/3917
  const _refetch = React.useCallback(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      if (loadDeck?.refetch) return loadDeck.refetch();
    });
    return () => task.cancel();
  }, [loadDeck?.refetch]);

  useFocusEffect(
    React.useCallback(() => {
      if (lastFocusedTime) {
        _refetch();
      }
      lastFocusedTime = Date.now();
      return () => _maybeSaveDeck(); // save on blur
    }, [deck, _refetch])
  );

  const _goBack = async () => {
    await _maybeSaveDeck();
    navigation.goBack();
  };

  const _deleteDeck = async () => {
    await deleteDeck({ variables: { deckId } });
    _goBack();
  };

  React.useEffect(() => {
    if (!loadDeck.loading && !loadDeck.error && loadDeck.data) {
      setDeck(loadDeck.data.deck);
      (async () => {
        const viewModePreference = await getViewModePreference(loadDeck.data.deck.deckId);
        if (viewModePreference) {
          setViewMode({ mode: viewModePreference });
        }
      })();
    }
  }, [loadDeck.loading, loadDeck.error, loadDeck.data]);

  const _changeDeck = (changes) => {
    setDeck({
      ...deck,
      ...changes,
      isChanged: true,
    });
  };

  const maybeDeleteCard = React.useCallback(
    (cardId) => {
      showActionSheetWithOptions(
        {
          title: 'Delete card?',
          options: ['Delete Card', 'Cancel'],
          destructiveButtonIndex: 0,
        },
        (index) => {
          if (index === 0) {
            const newCards = deck.cards.filter((c) => c.cardId !== cardId);
            deleteCard({ variables: { cardId } });
            setDeck({
              ...deck,
              cards: newCards,
            });
          }
        }
      );
    },
    [deleteCard, deck?.cards, setDeck, showActionSheetWithOptions]
  );

  const _showCardOptions = (card) => {
    let destructiveButtonIndex = undefined;
    let actions = [
      {
        name: 'Use as Top Card',
        action: async () => {
          const { deck: updatedDeck } = await Session.saveDeck(
            { ...card, makeInitialCard: true },
            { ...deck, initialCard: { cardId: card.cardId, id: card.id } }
          );
          setDeck(updatedDeck);
        },
      },
      {
        name: 'Duplicate Card',
        action: async () => {
          const newCard = await duplicateCard({ variables: { cardId: card.cardId } });
          setDeck({
            ...deck,
            cards: deck.cards.concat([newCard.data.duplicateCard]),
          });
        },
      },
    ];

    if (card.cardId !== deck.initialCard.cardId) {
      actions.push({
        name: 'Delete Card',
        action: () => maybeDeleteCard(card.cardId),
      });
      destructiveButtonIndex = actions.length - 1;
    }

    actions.push({
      name: 'Cancel',
      action: () => {},
    });

    showActionSheetWithOptions(
      {
        title: Utilities.makeCardPreviewTitle(card),
        options: actions.map((action) => action.name),
        destructiveButtonIndex,
        cancelButtonIndex: actions.length - 1,
      },
      async (buttonIndex) => {
        actions[buttonIndex].action();
      }
    );
  };

  const _navigateToCreateCard = React.useCallback(
    (card) => {
      if (deck?.deckId) {
        navigation.navigate('CreateDeck', {
          deckIdToEdit: deck.deckId,
          cardIdToEdit: card.cardId,
        });
      }
    },
    [deck]
  );

  const onPressNewCard = React.useCallback(
    () => _navigateToCreateCard({ cardId: LocalId.makeId() }),
    [_navigateToCreateCard]
  );

  const onChangeAccessPermissions = React.useCallback(
    async (accessPermissions) => {
      const deckUpdateFragment = { deckId, accessPermissions };
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, accessPermissions });
    },
    [setDeck, saveDeck, deck, deckId]
  );

  const onChangeCommentsEnabled = React.useCallback(
    async (commentsEnabled) => {
      const deckUpdateFragment = { deckId, commentsEnabled };
      saveDeck({ variables: { deck: deckUpdateFragment } });
      setDeck({ ...deck, commentsEnabled });
    },
    [setDeck, saveDeck, deck, deckId]
  );

  return (
    <React.Fragment>
      <SafeAreaView style={Constants.styles.container}>
        <ScreenHeader
          title="Deck"
          onBackButtonPress={_goBack}
          RightButtonComponent={
            deck ? (
              <TouchableOpacity
                style={Constants.styles.siteHeaderButton}
                onPress={deck ? () => navigation.navigate('ShareDeck', { deck }) : null}>
                <View style={Constants.styles.primaryButton}>
                  <Icon
                    name={
                      deck.visibility === 'private'
                        ? 'lock'
                        : deck.visibility === 'unlisted'
                        ? 'link'
                        : 'public'
                    }
                    size={18}
                    color="#000"
                    style={Constants.styles.primaryButtonIconLeft}
                  />
                  <Text style={Constants.styles.primaryButtonLabel}>Share</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
        />
        {loadDeck.loading && !deck ? (
          <ActivityIndicator size="large" color="#fff" style={{ padding: 48 }} />
        ) : (
          <>
            <View style={styles.settingsRow}>
              <View style={styles.layoutPicker}>
                <Pressable
                  style={styles.layoutButton}
                  onPress={() =>
                    setViewMode({
                      mode: 'carousel',
                      deckId: deck.deckId,
                    })
                  }
                  hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
                  <Icon
                    name="view-carousel"
                    size={24}
                    color={viewMode === 'carousel' ? '#fff' : '#888'}
                  />
                </Pressable>
                <Pressable
                  style={styles.layoutButton}
                  onPress={() => setViewMode({ mode: 'grid', deckId: deck.deckId })}
                  hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
                  <Icon name="apps" size={24} color={viewMode === 'grid' ? '#fff' : '#888'} />
                </Pressable>
              </View>
              <View style={styles.layoutPicker}>
                {deck && deck.visibility === 'public' && deck.playCount ? (
                  <View style={styles.playCount}>
                    <Icon name="play-arrow" size={24} color="#888" />
                    <Text style={styles.playCountLabel}>{deck.playCount}</Text>
                  </View>
                ) : null}
                <Pressable onPress={openSettingsSheet}>
                  {({ pressed }) => (
                    <Icon name="settings" size={24} color={pressed ? '#333' : '#888'} />
                  )}
                </Pressable>
              </View>
            </View>
            <CardsSet
              deck={deck}
              onShowCardOptions={_showCardOptions}
              onPress={_navigateToCreateCard}
              mode={viewMode}
            />
            <TouchableOpacity
              style={Constants.styles.floatingActionButton}
              onPress={onPressNewCard}>
              <FastImage
                style={styles.addCardIcon}
                source={require('../../assets/images/create-card.png')}
              />
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
      {settingsSheetVisible ? <SheetBackgroundOverlay onPress={closeSettingsSheet} /> : null}
      <DeckSettingsSheet
        isOpen={settingsSheetVisible}
        onClose={closeSettingsSheet}
        deck={deck}
        onChange={_changeDeck}
        onDeleteDeck={_deleteDeck}
        onChangeAccessPermissions={onChangeAccessPermissions}
        onChangeCommentsEnabled={onChangeCommentsEnabled}
      />
    </React.Fragment>
  );
};
