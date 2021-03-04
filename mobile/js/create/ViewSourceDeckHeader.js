import React from 'react';
import { View, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { DeckParentAttribution } from './DeckParentAttribution';
import { SegmentedNavigation } from '../components/SegmentedNavigation';

import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: Constants.colors.grayOnBlackBorder,
  },
  navigationRow: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
  },
  back: {
    flexShrink: 0,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    width: '100%',
    height: '100%',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -54, // required to center properly with back button
    zIndex: -1, // required to prevent negative margin from blocking back button
  },
  header: {
    padding: 16,
    justifyContent: 'center',
  },
  titleLabel: {
    padding: 8,
    color: '#fff',
    fontSize: 16,
  },
  instructionsLabel: {
    padding: 8,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export const ViewSourceDeckHeader = ({ deck, onPressBack }) => {
  const message =
    deck?.accessPermissions === 'cloneable'
      ? `You are viewing the source for this deck.`
      : `You are viewing the source for this deck. You can see how it works, but you can't save changes.`;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navigationRow}>
        <TouchableOpacity style={styles.back} onPress={onPressBack}>
          <Icon name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.title}>
          {deck ? (
            <Text style={styles.titleLabel}>
              <Text style={{ fontWeight: 'bold' }}>@{deck.creator?.username}</Text>'s deck
            </Text>
          ) : null}
        </View>
      </View>
      {deck ? (
        <View style={styles.header}>
          <Text style={styles.instructionsLabel}>{message}</Text>
          <DeckParentAttribution parentDeckId={deck.parentDeckId} parentDeck={deck.parentDeck} />
        </View>
      ) : null}
    </View>
  );
};
