import React, { useState, useEffect } from 'react';
import {
  View,
  AppRegistry,
  Platform,
  DeviceEventEmitter,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { ApolloProvider } from '@apollo/react-hooks';
import { RootNavigator } from './Navigation';
import { AndroidNavigationContext } from './ReactNavigation';
import BootSplash from 'react-native-bootsplash';
import * as GhostEvents from './ghost/GhostEvents';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableAndroidFontFix } from './AndroidFontFix';

import { HomeScreen } from './home/HomeScreen';
import { FeaturedDecks } from './home/FeaturedDecks';
import { NewestDecks } from './home/NewestDecks';
import { RecentDecks } from './home/RecentDecks';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { UserListScreen } from './components/UserListScreen';

import * as Session from './Session';
import * as PushNotifications from './PushNotifications';

let bootSplashHidden = false;

// Fixes the problem with font rendering on OnePlus phones, like Charlie's
enableAndroidFontFix();

const Main = () => {
  const { initialized } = Session.useSession();

  // Session not yet initialized? Just show a loading screen...
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      />
    );
  }

  if (!bootSplashHidden) {
    setTimeout(() => BootSplash.hide({ duration: 150 }), 100);
    bootSplashHidden = true;
  }
  return <RootNavigator />;
};

const MainProvider = (props) => {
  if (props.initialPushNotificationDataString) {
    PushNotifications.setInitialData(props.initialPushNotificationDataString);
  }

  return (
    <View style={{ flex: 1 }}>
      <Session.Provider>
        <GhostEvents.Provider>
          <ApolloProvider client={Session.apolloClient}>
            <ActionSheetProvider>
              <SafeAreaProvider>
                <Main />
              </SafeAreaProvider>
            </ActionSheetProvider>
          </ApolloProvider>
        </GhostEvents.Provider>
      </Session.Provider>
    </View>
  );
};

if (Platform.OS === 'android') {
  const WaitForSession = (props) => {
    const { initialized } = Session.useSession();

    // Session not yet initialized? Just show a loading screen...
    if (!initialized) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black',
          }}
        />
      );
    }

    return React.Children.only(props.children);
  };

  const AddProviders = (props) => {
    return (
      <View style={{ flex: 1 }}>
        <AndroidNavigationContext.Provider
          value={{
            navigatorId: props.navigatorId,
            viewId: props.viewId,
            navigatorWindowHeight: props.navigatorWindowHeight,
            globalNavigatorHeightOffset: props.globalNavigatorHeightOffset,
            navigatorStackDepth: props.navigatorStackDepth,
          }}>
          <Session.Provider>
            <GhostEvents.Provider>
              <ApolloProvider client={Session.apolloClient}>
                <ActionSheetProvider>
                  <SafeAreaProvider>
                    <WaitForSession>{React.Children.only(props.children)}</WaitForSession>
                  </SafeAreaProvider>
                </ActionSheetProvider>
              </ApolloProvider>
            </GhostEvents.Provider>
          </Session.Provider>
        </AndroidNavigationContext.Provider>
      </View>
    );
  };

  const windowHeight = Dimensions.get('window').height;

  let globalVerticalSpaceTaken = null;

  const WrapComponent = (Component, opts = {}) => {
    return () => {
      return (props) => {
        const [newProps, setNewProps] = useState({});

        useEffect(() => {
          let subscription = DeviceEventEmitter.addListener(
            'CastleNativeNavigationProp',
            (event) => {
              let componentId = event.componentId;
              if (componentId == props.componentId) {
                let newProps = {};
                if (event.props.navigationScreenOptions) {
                  newProps = JSON.parse(event.props.navigationScreenOptions);
                }

                setNewProps(newProps);
              }
            }
          );

          return () => {
            subscription.remove();
          };
        });

        let childProps = {};
        if (props.navigationScreenOptions) {
          childProps = JSON.parse(props.navigationScreenOptions);
        }

        let verticalSpaceTaken = 0;
        if (props.navigationHeight) {
          verticalSpaceTaken += props.navigationHeight / PixelRatio.get();
        }

        if (props.initialPushNotificationDataString) {
          PushNotifications.setInitialData(props.initialPushNotificationDataString);
        }

        if (!globalVerticalSpaceTaken) {
          // Viewport.vh is set globally instead of for each root view,
          // so we just use the first measurement for doing calculations that involve vh
          globalVerticalSpaceTaken = verticalSpaceTaken;
        }

        return (
          <View style={{ flex: 1 }}>
            <AddProviders
              navigatorId={props.navigatorId}
              viewId={props.viewId}
              navigatorWindowHeight={windowHeight - verticalSpaceTaken}
              globalNavigatorHeightOffset={globalVerticalSpaceTaken}
              navigatorStackDepth={props.stackDepth}>
              <Component {...{ ...childProps, ...newProps }} />
            </AddProviders>

            {opts.addTabBarPadding && <View style={{ height: 50 }} />}
          </View>
        );
      };
    };
  };

  AppRegistry.registerComponent('HomeScreen', WrapComponent(HomeScreen));
  AppRegistry.registerComponent('FeaturedDecks', WrapComponent(FeaturedDecks));
  AppRegistry.registerComponent('NewestDecks', WrapComponent(NewestDecks));
  AppRegistry.registerComponent('RecentDecks', WrapComponent(RecentDecks));
  AppRegistry.registerComponent('PlayDeck', WrapComponent(PlayDeckScreen));
  AppRegistry.registerComponent(
    'ProfileScreen',
    WrapComponent(ProfileScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent(
    'Profile',
    WrapComponent(ProfileScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent('LoginScreen', WrapComponent(LoginScreen));
  AppRegistry.registerComponent('CreateAccountScreen', WrapComponent(CreateAccountScreen));
  AppRegistry.registerComponent('ForgotPasswordScreen', WrapComponent(ForgotPasswordScreen));
  AppRegistry.registerComponent(
    'CreateScreen',
    WrapComponent(CreateScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent('CreateDeck', WrapComponent(CreateDeckNavigator));
  AppRegistry.registerComponent('ViewSource', WrapComponent(ViewSourceNavigator));
  AppRegistry.registerComponent(
    'Notifications',
    WrapComponent(NotificationsScreen, { addTabBarPadding: true })
  );
  AppRegistry.registerComponent('UserList', WrapComponent(UserListScreen));

  const handlePushNotification = ({ data, clicked }) => {
    if (data?.numUnseenNotifications && !clicked) {
      // Update badge so we don't have to wait on maybeFetchNotificationsAsync() to do it
      Session.setNotifBadge(data.numUnseenNotifications);
    }
    Session.maybeFetchNotificationsAsync();
  };
  PushNotifications.addClickedListener((data) => handlePushNotification({ data, clicked: true }));
  PushNotifications.addReceivedListener((data) => handlePushNotification({ data, clicked: false }));

  (async () => {
    await Session.loadAuthTokenAsync();
    await Session.maybeFetchNotificationsAsync();
  })();

  DeviceEventEmitter.addListener('onAppStateChange', async (state) => {
    if (state == 'active') {
      await Session.maybeFetchNotificationsAsync();
    }
  });
}

export default MainProvider;
