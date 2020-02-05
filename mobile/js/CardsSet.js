import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import * as Utilities from './utilities';

import CardCell from './CardCell';

const styles = StyleSheet.create({
  gridContainer: {
    paddingLeft: 8,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    width: '33%',
    height: 192, // TODO: correct ratio
  },
  listContainer: {
    borderTopWidth: 1,
    borderColor: '#888',
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#888',
    padding: 16,
  },
  cardTitle: {
    color: '#fff',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sortLabel: {
    color: '#ccc',
    textTransform: 'uppercase',
  },
  layoutPicker: {
    flexDirection: 'row',
  },
  layoutButton: {
    margin: 6,
  },
  searchContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#888',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    padding: 12,
    paddingLeft: 40,
    color: '#fff',
    width: '100%',
  },
});

const SearchInput = (props) => {
  const { label } = props;
  return (
    <View style={styles.searchContainer}>
      <FastImage
        style={{
          width: 16,
          aspectRatio: 1,
          marginLeft: 12,
          marginRight: -28,
        }}
        source={require('../assets/images/search.png')}
      />
      <TextInput style={styles.input} placeholderTextColor="#999" {...props} />
    </View>
  );
};

const CardListItem = ({ card, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <Text style={styles.cardTitle}>{card.title}</Text>
  </TouchableOpacity>
);

const CardsList = ({ deck, onPress, searchQuery }) => {
  let cards;
  if (deck) {
    cards =
      searchQuery && searchQuery.length
        ? deck.cards.filter((card) => Utilities.cardMatchesSearchQuery(card, searchQuery))
        : deck.cards;
  }
  return (
    <View style={styles.listContainer}>
      {cards &&
        cards.map((card) => (
          <CardListItem key={card.cardId} card={card} onPress={() => onPress(card)} />
        ))}
    </View>
  );
};

const CardsGrid = ({ deck, onPress }) => {
  return (
    <View style={styles.gridContainer}>
      {deck &&
        deck.cards.map((card) => (
          <View style={styles.cellContainer} key={card.cardId}>
            <CardCell card={card} onPress={() => onPress(card)} />
          </View>
        ))}
    </View>
  );
};

const CardsSet = (props) => {
  const [state, setState] = React.useState({ mode: 'grid', searchQuery: '' });

  const setMode = (mode) =>
    setState({
      mode,
      searchQuery: '',
    });

  const setQuery = (searchQuery) =>
    setState({
      ...state,
      searchQuery,
    });

  return (
    <View style={styles.container}>
      {state.mode === 'list' && (
        <SearchInput placeholder="Search" value={state.searchQuery} onChangeText={setQuery} />
      )}
      <View style={styles.settingsRow}>
        <Text style={styles.sortLabel}>Sort: Arbitrary</Text>
        <View style={styles.layoutPicker}>
          <TouchableOpacity
            style={styles.layoutButton}
            onPress={() => setMode('grid')}
            hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
            <FastImage
              style={{
                width: 12,
                aspectRatio: 1,
              }}
              source={require('../assets/images/layout-grid.png')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.layoutButton}
            onPress={() => setMode('list')}
            hitSlop={{ top: 2, left: 2, bottom: 2, right: 2 }}>
            <FastImage
              style={{
                width: 12,
                aspectRatio: 1,
              }}
              source={require('../assets/images/layout-list.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
      {state.mode === 'grid' ? (
        <CardsGrid {...props} />
      ) : (
        <CardsList searchQuery={state.searchQuery} {...props} />
      )}
    </View>
  );
};

export default CardsSet;
