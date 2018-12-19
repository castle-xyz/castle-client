// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React from 'react';
import {
  createStackNavigator,
  createSwitchNavigator,
} from 'react-navigation';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

import GameScreen from './GameScreen';

const GameNavigator = createStackNavigator({
  GameScreen: {
    screen: GameScreen,
    navigationOptions: { title: 'Game' },
  },
});

const RootNavigator = createSwitchNavigator({
  GameNavigator,
});

// Based on https://reactnavigation.org/docs/en/screen-tracking.html
const getActiveRouteName = navigationState => {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  if (route.routes) {
    return getActiveRouteName(route);
  }
  return route.routeName;
};

export default () => (
  <RootNavigator
    onNavigationStateChange={(prevState, currState) => {
      const prev = getActiveRouteName(prevState);
      const curr = getActiveRouteName(currState);

      if (prev !== curr) {
        // Report screen analytics here...
      }
    }}
  />
);
