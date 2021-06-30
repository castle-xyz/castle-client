import React from 'react';
import { Keyboard, View, PixelRatio, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { isTablet } from 'react-native-device-info';
import * as GhostUI from '../ghost/GhostUI';

import * as Constants from '../Constants';
import * as LibraryEntryClipboard from './LibraryEntryClipboard';
import * as Utilities from '../common/utilities';

import Viewport from '../common/viewport';

import * as GhostEvents from '../ghost/GhostEvents';
import { useListen, useCoreState, sendGlobalAction, sendAsync } from '../core/CoreEvents';

import { CardScene } from '../game/CardScene';
import { CardSceneLoading } from './CardSceneLoading';
import { CardText } from '../components/CardText';
import { CreateCardContext } from './CreateCardContext';
import { CreateCardHeader, CARD_HEADER_HEIGHT } from './CreateCardHeader';
import { CreateCardFooter, getFooterHeight } from './CreateCardFooter';
import { DrawingCardHeader, DRAWING_CARD_HEADER_HEIGHT } from './drawing/DrawingCardHeader';

import { PopoverProvider } from '../components/PopoverProvider';
import { SheetProvider } from './SheetProvider';

import { getActiveTool, getInspectorTags } from './SceneCreatorUtilities';

const TABLET_BELT_HEIGHT_MULTIPLIER = isTablet() ? 2 : 1;
const MIN_BELT_HEIGHT = 1.2 * TABLET_BELT_HEIGHT_MULTIPLIER * 48;
const MAX_BELT_HEIGHT = 1.2 * TABLET_BELT_HEIGHT_MULTIPLIER * 60;

const styles = StyleSheet.create({
  cardBody: {
    // contains just the card as a child
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  scene: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  textActorsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  textActorsAspectRatio: {
    aspectRatio: Constants.CARD_RATIO,
    width: '100%',
    height: '100%',
    maxWidth: 100 * Viewport.vw,
    maxHeight: (100 * Viewport.vw) / Constants.CARD_RATIO,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});

// TODO: find a cleaner way to get these
const getLibraryEntries = (root) => {
  const element = root?.panes ? root.panes['sceneCreatorBlueprints'] : null;
  if (!element) return null;

  let blueprintsData;
  if (element.children.count) {
    Object.entries(element.children).forEach(([key, child]) => {
      if (child.type === 'data') {
        blueprintsData = child.props.data;
      }
    });
  }

  return blueprintsData?.library;
};

const getExpressions = (root) => {
  const element = root?.panes ? root.panes['sceneCreatorExpressions'] : null;
  if (!element) return null;

  let expressions;
  if (element.children.count) {
    expressions = element.children.data?.props?.data?.expressions;
  }
  return expressions;
};

// TODO: consolidate with PlayDeck
const useCoreTextActors = () => {
  const [textActors, setTextActors] = React.useState([]);
  useListen({
    eventName: 'TEXT_ACTORS_DATA',
    handler: ({ data }) => {
      const { textActors } = JSON.parse(data);
      setTextActors(textActors);
    },
  });
  return textActors;
};

export const CreateCardScreen = ({
  card,
  deck,
  initialIsEditing = true,
  loading,
  goToDeck,
  goToCard,
  cardNeedsSave,
  saveAndGoToDeck,
  saveAndGoToCard,
  onSceneMessage,
  onSceneRevertData,
  saveAction = 'none',
}) => {
  const { showActionSheetWithOptions } = useActionSheet();

  const [activeSheet, setActiveSheet] = React.useState(null);
  React.useEffect(Keyboard.dismiss, [activeSheet]);

  const [isShowingTextActors, setShowingTextActors] = React.useState(true);
  const [isShowingDraw, setIsShowingDraw] = React.useState(false);

  const { root, transformAssetUri } = GhostUI.useGhostUI();
  const globalActions = useCoreState('EDITOR_GLOBAL_ACTIONS');

  const isSceneLoaded = !!globalActions;
  const isPlaying =
    globalActions?.performing === undefined ? !initialIsEditing : globalActions.performing;
  const selectedActorId = globalActions?.selectedActorId;
  const isTextActorSelected = globalActions?.isTextActorSelected;
  const hasSelection = selectedActorId >= 0 && activeSheet !== 'capturePreview';
  const { activeToolData, activeToolAction } = getActiveTool(root);
  const textActors = useCoreTextActors();
  // TODO: const { tagToActorIds } = getInspectorTags(behaviors?.Tags);

  // lua's behaviors can be "tools"
  React.useEffect(() => {
    if (globalActions?.activeToolBehaviorId) {
      const activeToolBehavior = globalActions.tools.find(
        (behavior) => behavior.behaviorId === globalActions.activeToolBehaviorId
      );
      // show/hide new draw tool
      if (activeToolBehavior && activeToolBehavior.name == 'Draw2') {
        setIsShowingDraw(true);
      } else {
        setIsShowingDraw(false);
      }
    }
  }, [globalActions?.activeToolBehaviorId]);

  React.useEffect(() => {
    if (hasSelection) {
      // when going from no selection to selection, close any other sheets
      setActiveSheet(null);
    }
  }, [hasSelection]);

  React.useEffect(() => {
    // sync once on load, in case we already have something in JS clipboard
    if (isSceneLoaded) {
      LibraryEntryClipboard.sync();
    }
  }, [isSceneLoaded]);

  const selectActor = React.useCallback(
    (actorId) => {
      sendAsync('SELECT_ACTOR', {
        actorId,
      });
    },
    [sendAsync]
  );

  const maybeSaveAndGoToDeck = React.useCallback(async () => {
    // don't prompt on back button unless the card has changes and
    // we're in the card creator
    if (cardNeedsSave() && saveAction === 'save') {
      showActionSheetWithOptions(
        {
          title: 'Save changes?',
          options: ['Save', 'Discard', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex == 0) {
            return saveAndGoToDeck();
          } else if (buttonIndex == 1) {
            return goToDeck();
          }
        }
      );
    } else {
      return goToDeck();
    }
  }, [cardNeedsSave, saveAndGoToDeck, goToDeck]);

  const maybeSaveAndGoToCard = React.useCallback(
    async (nextCard) => {
      if (!Utilities.canGoToCard(nextCard, isPlaying)) {
        return;
      }
      if (!cardNeedsSave() || saveAction === 'none') {
        // no changes, or unable to save
        return goToCard(nextCard, isPlaying);
      } else {
        const title = Utilities.makeCardPreviewTitle(nextCard, deck);
        if (saveAction === 'save') {
          showActionSheetWithOptions(
            {
              title: `Save changes and go to '${title}'?`,
              options: ['Save and go', 'Cancel'],
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex == 0) {
                return saveAndGoToCard(nextCard, isPlaying);
              }
            }
          );
        } else {
          // can't clone and go to card, so prompt to discard before leaving
          showActionSheetWithOptions(
            {
              title: `Discard changes and go to '${title}'?`,
              options: ['Discard and go', 'Cancel'],
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex == 0) {
                return goToCard(nextCard, isPlaying);
              }
            }
          );
        }
      }
    },
    [cardNeedsSave, saveAndGoToCard, goToCard, isPlaying]
  );

  const onSelectBackupData = React.useCallback(
    (data) => {
      setActiveSheet(null);
      onSceneRevertData(data);
    },
    [onSceneRevertData, setActiveSheet]
  );

  GhostEvents.useListen({
    eventName: 'NAVIGATE_TO_CARD',
    handler: ({ card }) => maybeSaveAndGoToCard(card),
  });

  GhostEvents.useListen({
    eventName: 'GHOST_CAPTURE_PENDING',
    handler: async () => {
      await sendGlobalAction('onRewind');
      setActiveSheet('capturePreview');
    },
  });

  GhostEvents.useListen({
    eventName: 'SHOW_NEW_BLUEPRINT_SHEET',
    handler: () => {
      setActiveSheet('sceneCreatorNewBlueprint');
    },
  });

  if (Constants.Android) {
    // after the game loads, it listens for keyboard events and
    // causes react native's back button event to fail
    GhostEvents.useListen({
      eventName: 'CASTLE_SYSTEM_BACK_BUTTON',
      handler: maybeSaveAndGoToDeck,
    });
  }

  const cardBackgroundStyles = {
    backgroundColor: card.backgroundImage ? '#000' : '#f2f2f2',
    justifyContent: isTextActorSelected ? 'flex-start' : 'flex-end',
  };

  let cardFitStyles = null;
  const insets = useSafeAreaInsets();
  const headerHeight = isShowingDraw ? DRAWING_CARD_HEADER_HEIGHT : CARD_HEADER_HEIGHT;
  const footerHeight = getFooterHeight({ isShowingDraw });
  const maxCardHeight =
    100 * Viewport.vh - headerHeight - footerHeight - insets.top - insets.bottom;
  let beltHeight = maxCardHeight - (Viewport.vw * 100) / Constants.CARD_RATIO;
  beltHeight = Math.floor(Math.min(Math.max(MIN_BELT_HEIGHT, beltHeight), MAX_BELT_HEIGHT));
  const beltHeightFraction = beltHeight / maxCardHeight;

  if (isShowingDraw) {
    if ((Viewport.vw * 100) / maxCardHeight > 0.91) {
      cardFitStyles = {
        aspectRatio: 0.91,
        width: undefined,
        height: maxCardHeight,
      };
    } else {
      cardFitStyles = { aspectRatio: 0.91, width: '100%' };
    }
  } else {
    cardFitStyles = { width: '100%', height: maxCardHeight };
  }

  const isCardTextVisible =
    (isShowingTextActors || isPlaying) &&
    !isShowingDraw &&
    textActors &&
    Object.keys(textActors).length;

  // TODO: reduce this to only the following--
  // - top level screen props (deck, card)
  // - things from globalActions
  const contextValue = {
    deck,
    card,
    isSceneLoaded,
    isPlaying,
    selectedActorId,
    hasSelection,
    isTextActorSelected,
    library: getLibraryEntries(root),
    expressions: getExpressions(root),
    transformAssetUri,
    onSelectBackupData,
    isShowingTextActors,
    setShowingTextActors,
    activeToolData,
    activeToolAction,
    saveAction,
  };

  // SafeAreaView doesn't respond to statusbar being hidden right now
  // https://github.com/facebook/react-native/pull/20999
  return (
    <CreateCardContext.Provider value={contextValue}>
      <PopoverProvider>
        <SafeAreaView style={Constants.styles.container}>
          {isShowingDraw ? (
            <DrawingCardHeader onPressBack={() => sendGlobalAction('resetActiveTool')} />
          ) : (
            <CreateCardHeader
              card={card}
              isEditable
              mode={activeSheet}
              onChangeMode={setActiveSheet}
              onPressBack={maybeSaveAndGoToDeck}
              onSave={saveAndGoToDeck}
              creatorUsername={deck?.creator?.username}
              saveAction={saveAction}
            />
          )}
          <View style={styles.cardBody}>
            <View style={[styles.card, cardBackgroundStyles, cardFitStyles]}>
              <CardScene
                deck={deck}
                interactionEnabled={true}
                key={`card-scene-${card.scene && card.scene.sceneId}`}
                style={styles.scene}
                card={card}
                isEditable={true}
                initialIsEditing={initialIsEditing}
                onMessage={onSceneMessage}
                beltHeight={beltHeight}
                beltHeightFraction={beltHeightFraction}
              />
              {isCardTextVisible ? (
                <View
                  style={[styles.textActorsContainer, { marginTop: beltHeight }]}
                  pointerEvents="box-none">
                  <View
                    pointerEvents="box-none"
                    style={[
                      styles.textActorsAspectRatio,
                      { justifyContent: isTextActorSelected ? 'flex-start' : 'flex-end' },
                    ]}>
                    <CardText
                      disabled={loading}
                      visible={isCardTextVisible}
                      textActors={textActors}
                      card={card}
                      onSelect={selectActor}
                      isEditable={!isPlaying}
                    />
                  </View>
                </View>
              ) : null}
              {isSceneLoaded ? null : <CardSceneLoading />}
            </View>
          </View>
        </SafeAreaView>
        <SheetProvider
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
          isShowingDraw={isShowingDraw}
          beltHeight={beltHeight}
        />
      </PopoverProvider>
    </CreateCardContext.Provider>
  );
};
