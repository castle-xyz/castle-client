import React from 'react';
import { View, Text } from 'react-native';
import firebase from 'react-native-firebase';

import { Box, Button } from './Components';

export default class MeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', padding: 10 }}>
        <Box>
          <Text>
            iOS Build: {Expo.Constants.platform.ios.buildNumber}
            {'\n'}Revision ID: {Expo.Constants.manifest.revisionId}
          </Text>
        </Box>

        <Button style={{ marginTop: 6 }} onPress={this._signOut.bind(this)}>
          <Text>Sign Out</Text>
        </Button>

        <Button
          style={{ marginTop: 6 }}
          onPress={() => this.props.navigation.navigate('GameScreen')}>
          <Text>Play Game!</Text>
        </Button>
      </View>
    );
  }

  async _signOut() {
    await firebase.auth().signOut();
  }
}
