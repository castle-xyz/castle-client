import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Dropdown } from '../components/Dropdown';
import { shareDeck } from '../common/utilities';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '../ReactNavigation';

import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: Constants.FEED_ITEM_HEADER_HEIGHT,
    width: '100%',
    borderTopLeftRadius: Constants.CARD_BORDER_RADIUS,
    borderTopRightRadius: Constants.CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  containerSkeleton: {
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    marginRight: 12,
  },
  rightButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  rightButtonIcon: {
    ...Constants.styles.textShadow,
  },
});

export const PlayDeckActionsSkeleton = () => {
  return <View style={[styles.container, styles.containerSkeleton]} />;
};

export const PlayDeckActions = ({
  deck,
  isPlaying,
  onPressBack,
  disabled,
  additionalPadding,
  onBlockUser,
  onReportDeck,
  isMe = false,
  isAnonymous = false,
}) => {
  const { creator } = deck;
  const { push } = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();

  let backTransform = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(backTransform, {
      toValue: isPlaying ? 1 : 0,
      friction: 20,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  let dropdownItems = [];
  if (!isAnonymous) {
    // TODO: enable anonymous view source
    dropdownItems.push({
      id: 'view-source',
      icon: 'search',
      name: 'View deck source',
    });
  }
  if (!isMe && onReportDeck) {
    dropdownItems.push({
      id: 'report',
      icon: 'flag',
      name: 'Report and hide this deck',
    });
  }
  if (!isMe && onBlockUser) {
    dropdownItems.push({
      id: 'block',
      icon: 'block',
      name: `Block @${creator.username}`,
    });
  }

  const onSelectDropdownAction = React.useCallback(
    (id) => {
      switch (id) {
        case 'view-source': {
          push('ViewSource', { deckIdToEdit: deck.deckId });
          break;
        }
        case 'block': {
          showActionSheetWithOptions(
            {
              title: `Block this person?`,
              options: ['Block', 'Cancel'],
              destructiveButtonIndex: 0,
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onBlockUser();
              }
            }
          );
          break;
        }
        case 'report': {
          showActionSheetWithOptions(
            {
              title: `Does this deck violate our community guidelines? Let us know and we will not show it to you anymore.`,
              options: ['Report and hide', 'Cancel'],
              destructiveButtonIndex: 0,
              cancelButtonIndex: 1,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) {
                onReportDeck();
              }
            }
          );
          break;
        }
      }
    },
    [deck?.deckId, onBlockUser, onReportDeck]
  );

  return (
    <View
      style={{
        ...styles.container,
        paddingLeft: isPlaying ? 12 + additionalPadding : 12,
        paddingRight: 12,
      }}>
      <Animated.View
        style={{
          ...styles.row,
          flex: -1,
          paddingRight: 16,
        }}>
        <Pressable style={styles.back} onPress={onPressBack}>
          {({ pressed }) => (
            <Animated.View style={{ opacity: backTransform }}>
              <Icon name="arrow-back" color={pressed ? '#ccc' : '#fff'} size={32} />
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
      <View style={styles.row} pointerEvents={disabled ? 'none' : 'auto'}>
        <Dropdown
          style={styles.rightButton}
          labeledItems={dropdownItems}
          onChange={onSelectDropdownAction}>
          <Feather name="more-horizontal" color="#fff" size={24} style={styles.rightButtonIcon} />
        </Dropdown>
        <Pressable style={styles.rightButton} onPress={() => shareDeck(deck)}>
          {({ pressed }) => (
            <Feather
              name={Constants.iOS ? 'share' : 'share-2'}
              color={pressed ? '#ccc' : '#fff'}
              size={24}
              style={styles.rightButtonIcon}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};
