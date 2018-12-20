import { Updates } from 'expo';
import React from 'react';
import { View, StatusBar, Alert } from 'react-native';

import Navigation from './js/Navigation';

// Check for published JS updates periodically in non-development
if (!__DEV__) {
  let prompted = false;
  let interval;
  const check = async () => {
    if (!prompted) {
      if ((await Updates.checkForUpdateAsync()).isAvailable) {
        prompted = true;
        clearInterval(interval);

        const fetching = Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Available',
          'Would you like to restart to use the latest version of castle? You will lose unsaved changes.',
          [
            {
              text: 'No',
              onPress: () => {},
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: async () => {
                await fetching;
                Updates.reloadFromCache();
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
  };
  interval = setInterval(check, 5000);
  setTimeout(check, 80);
}

// Let `Navigation` handle everything
export default () => (
  <View
    style={{
      flex: 1,
      backgroundColor: 'white',
    }}>
    <StatusBar backgroundColor="white" barStyle="dark-content" />
    <Navigation />
  </View>
);
