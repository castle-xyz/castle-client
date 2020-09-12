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

import { FeaturedDecks } from './home/FeaturedDecks';
import { NewestDecks } from './home/NewestDecks';
import { RecentDecks } from './home/RecentDecks';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { ProfileScreen } from './profile/ProfileScreen';
import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';

import * as Session from './Session';

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

const MainProvider = () => {
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
            navigatorWindowHeight: props.navigatorWindowHeight,
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

  const WrapComponent = (Component) => {
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

        let verticalSpaceTaken = 20;
        if (props.navigationHeight) {
          verticalSpaceTaken += props.navigationHeight / PixelRatio.get();
        }

        return (
          <View>
            <View style={{ height: windowHeight - verticalSpaceTaken }}>
              <AddProviders
                navigatorId={props.navigatorId}
                navigatorWindowHeight={windowHeight - verticalSpaceTaken}>
                <Component {...{ ...childProps, ...newProps }} />
              </AddProviders>
            </View>
            <View style={{ height: verticalSpaceTaken, backgroundColor: 'black' }} />
          </View>
        );
      };
    };
  };

  AppRegistry.registerComponent('FeaturedDecks', WrapComponent(FeaturedDecks));
  AppRegistry.registerComponent('NewestDecks', WrapComponent(NewestDecks));
  AppRegistry.registerComponent('RecentDecks', WrapComponent(RecentDecks));
  AppRegistry.registerComponent('PlayDeck', WrapComponent(PlayDeckScreen));
  AppRegistry.registerComponent('ProfileScreen', WrapComponent(ProfileScreen));
  AppRegistry.registerComponent('Profile', WrapComponent(ProfileScreen));
  AppRegistry.registerComponent('LoginScreen', WrapComponent(LoginScreen));
  AppRegistry.registerComponent('CreateAccountScreen', WrapComponent(CreateAccountScreen));
  AppRegistry.registerComponent('ForgotPasswordScreen', WrapComponent(ForgotPasswordScreen));
  AppRegistry.registerComponent('CreateScreen', WrapComponent(CreateScreen));
  AppRegistry.registerComponent('CreateDeck', WrapComponent(CreateDeckNavigator));
  AppRegistry.registerComponent('ViewSource', WrapComponent(ViewSourceNavigator));
}

export default MainProvider;
