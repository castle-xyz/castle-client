// Assemble all the `*Screen`s together using `*Navigator`s. Confine navigation things to this
// module so that the app's navigation flow is always clear.

import React from 'react';
import {
  createStackNavigator,
  createBottomTabNavigator,
  withNavigationFocus,
  createSwitchNavigator,
} from 'react-navigation';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import hoistNonReactStatics from 'hoist-non-react-statics';

import BrowseScreen from './BrowseScreen';
import CreateScreen from './CreateScreen';
import MeScreen from './MeScreen';
import { AuthLoadingScreen, AuthScreen, NewProfileScreen } from './AuthScreens';
import * as Analytics from './Analytics';
import GameScreen from './GameScreen';

const BrowseNavigator = createStackNavigator({
  BrowseScreen: {
    screen: BrowseScreen,
  },
});

const MeNavigator = createStackNavigator({
  MeScreen: {
    screen: MeScreen,
    navigationOptions: { title: 'Me' },
  },
});

const CreateNavigator = createStackNavigator({
  // Workaround to deal with bug where React Navigation will accidentally mount `CreateScreen` too
  // many times. `CreateScreen` starts a `FileServer` and opens a `GhostView` etc. so it really
  // needs to only have one instance be mounted.
  CreateScreen: hoistNonReactStatics(
    withNavigationFocus(
      ({ isFocused, ...rest }) => (isFocused ? <CreateScreen {...rest} /> : null)
    ),
    CreateScreen
  ),
});

const GameNavigator = createStackNavigator({
  GameScreen: {
    screen: GameScreen,
    navigationOptions: { title: 'Game' },
  },
});

const TabNavigator = createBottomTabNavigator(
  {
    BrowseNavigator,
    CreateNavigatorPlaceholder: {
      // Placeholder that just navigates to the `CreateNavigator` modal
      screen: () => {},
      navigationOptions: {
        tabBarOnPress: ({ navigation }) => navigation.navigate('CreateNavigator'),
      },
    },
    MeNavigator,
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ tintColor }) => {
        const { routeName } = navigation.state;
        switch (routeName) {
          case 'BrowseNavigator':
            return <FontAwesome name="globe" size={25} color={tintColor} />;
          case 'CreateNavigatorPlaceholder':
            return <FontAwesome name="paint-brush" size={25} color={tintColor} />;
          case 'MeNavigator':
            return <FontAwesome name="user" size={25} color={tintColor} />;
        }
      },
    }),
    tabBarOptions: {
      showLabel: false,
    },
  }
);

const AppNavigator = createStackNavigator(
  {
    TabNavigator,
    CreateNavigator: {
      screen: CreateNavigator,
      navigationOptions: () => ({
        gesturesEnabled: false,
      }),
    },
    GameNavigator: {
      screen: GameNavigator,
      navigationOptions: () => ({
        gesturesEnabled: false,
      }),
    },
  },
  {
    mode: 'modal', // Makes navigations animate in from the bottom
    headerMode: 'none',
  }
);

const AuthNavigator = createStackNavigator({
  AuthScreen: {
    screen: AuthScreen,
    navigationOptions: { title: 'Sign In' },
  },
  NewProfileScreen: {
    screen: NewProfileScreen,
    navigationOptions: { title: 'New Profile', headerLeft: null },
  },
});

const RootNavigator = createSwitchNavigator({
  AuthLoadingScreen,
  AppNavigator,
  AuthNavigator,
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
        Analytics.visitScreen(curr);
      }
    }}
  />
);
