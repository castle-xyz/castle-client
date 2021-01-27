import React from 'react';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSession, maybeFetchNotificationsAsync, setNotifBadge } from './Session';

import { LoginScreen, CreateAccountScreen, ForgotPasswordScreen } from './AuthScreens';
import { CreateScreen } from './create/CreateScreen';
import { CreateDeckNavigator } from './create/CreateDeckNavigator';
import { useAppState } from './ghost/GhostAppState';
import { HomeScreen } from './home/HomeScreen';
import { NotificationsScreen } from './notifications/NotificationsScreen';
import { PlayDeckScreen } from './play/PlayDeckScreen';
import { UserListScreen } from './components/UserListScreen';
import { ViewSourceNavigator } from './create/ViewSourceNavigator';
import { ProfileScreen } from './profile/ProfileScreen';

import * as DeepLinks from './DeepLinks';
import * as GhostChannels from './ghost/GhostChannels';
import * as PushNotifications from './PushNotifications';

import FastImage from 'react-native-fast-image';

enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICON_SIZE = 28;

// App UI layout

const BrowseNavigator = () => (
  <Stack.Navigator
    initialRouteName="HomeScreen"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const CreateNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen
      name="Create"
      component={CreateScreen}
      options={{
        title: 'Create',
      }}
    />
    <Stack.Screen
      name="CreateDeck"
      component={CreateDeckNavigator}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const NotificationsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
    <Stack.Screen name="UserList" component={UserListScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const ProfileNavigator = () => (
  <Stack.Navigator
    initialRouteName="Profile"
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="PlayDeck" component={PlayDeckScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen
      name="ViewSource"
      component={ViewSourceNavigator}
      options={{ gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const TabNavigator = ({ notificationsBadgeCount }) => {
  const initialPushData = PushNotifications.getInitialData();
  return (
    <Tab.Navigator
      initialRouteName={initialPushData ? 'Notifications' : 'Browse'}
      tabBarOptions={{
        activeTintColor: '#fff',
        inactiveTintColor: '#888',
        style: {
          borderTopColor: '#888',
          backgroundColor: '#000',
        },
        showLabel: false,
      }}>
      <Tab.Screen
        name="Browse"
        component={BrowseNavigator}
        options={({ route }) => {
          const isHome = route.state?.index === 0;
          let isPlayingFeedDeck = false;
          if (route?.state?.routes && route.state.routes.length) {
            isPlayingFeedDeck = route.state.routes[0].params?.deckId !== undefined;
          }
          return {
            tabBarVisible: !route.state || (isHome && !isPlayingFeedDeck),
            tabBarIcon: ({ focused, color }) => {
              return (
                <FastImage
                  tintColor={color}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                  }}
                  source={require('../assets/images/BottomTabs-browse.png')}
                />
              );
            },
          };
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateNavigator}
        options={({ route }) => ({
          tabBarVisible: !route.state || route.state.index == 0,
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-create.png')}
              />
            );
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsNavigator}
        options={({ route }) => ({
          tabBarVisible: !route.state || route.state.index == 0,
          tabBarBadge: notificationsBadgeCount > 0 ? notificationsBadgeCount : null,
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-notifications.png')}
              />
            );
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={({ route }) => ({
          tabBarVisible: !route.state || route.state.index == 0,
          tabBarIcon: ({ focused, color }) => {
            return (
              <FastImage
                tintColor={color}
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                source={require('../assets/images/BottomTabs-profile.png')}
              />
            );
          },
        })}
      />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="CreateAccountScreen" component={CreateAccountScreen} />
    <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

function onNavigationStateChange(state) {
  GhostChannels.globalPause();
}

// https://reactnavigation.org/docs/themes/
const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000',
    notification: '#fff',
  },
};

const rootNavRef = React.createRef();
const navRefCallback = (r) => {
  rootNavRef.current = r;
  DeepLinks.setNavigationRef(r);
};

export const RootNavigator = () => {
  const { isSignedIn, notificationsBadgeCount } = useSession();

  // fetch notifications when a notif arrives while we're running
  const handlePushNotification = React.useCallback(({ data, clicked }) => {
    if (data?.numUnseenNotifications && !clicked) {
      // Update badge so we don't have to wait on maybeFetchNotificationsAsync() to do it
      setNotifBadge(data.numUnseenNotifications);
    }
    if (clicked && rootNavRef.current) {
      // pass the `screen` param to ensure we pop to the top of the stack
      rootNavRef.current.navigate('Notifications', { screen: 'Notifications' });
    }
    setTimeout(maybeFetchNotificationsAsync, 250);
  }, []);
  PushNotifications.usePushNotifications({
    onClicked: (data) => handlePushNotification({ data, clicked: true }),
    onReceived: (data) => handlePushNotification({ data, clicked: false }),
  });

  // fetch notifs when we first notice a signed in user (including every app boot)
  React.useEffect(() => {
    if (isSignedIn) {
      maybeFetchNotificationsAsync();
    }
  }, [isSignedIn]);

  // fetch notifs when the app foregrounds
  useAppState(
    React.useCallback((state) => {
      if (state === 'active') {
        maybeFetchNotificationsAsync();
      }
    }, [])
  );

  return (
    <NavigationContainer
      theme={NavigationTheme}
      ref={navRefCallback}
      onStateChange={onNavigationStateChange}>
      {isSignedIn ? (
        <TabNavigator notificationsBadgeCount={notificationsBadgeCount} />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};
