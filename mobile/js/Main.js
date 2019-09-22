import { AppLoading } from 'expo';
import React from 'react';
import { View, StatusBar, AsyncStorage } from 'react-native';
import { ApolloProvider } from 'react-apollo';

import './AutoUpdates';
import './GhostConsole';
import { createRootNavigator } from './Navigation';
import * as Conn from './Conn';
import './GhostMultiplayer';

export let onApolloClientChanged;

export default class Main extends React.Component {
  state = {
    appLoading: true, // Whether to continue rendering the splash screen
    rootNavigator: null,
    apolloClient: null,
  };

  constructor(props, context) {
    super(props, context);

    onApolloClientChanged = (apolloClient) => {
      this.setState({ apolloClient });
    };

    (async () => {
      const authToken = await AsyncStorage.getItem('authToken');
      await Conn.initAsync(authToken);

      this.setState({
        apolloClient: Conn.apolloClient,
        appLoading: false,
        rootNavigator: createRootNavigator({
          initialRouteName: await Conn.isSignedInAsync() ? 'GameNavigator' : 'SignInNavigator',
        }),
      });
    })();
  }

  render() {
    if (this.state.appLoading) {
      return <AppLoading/>;
    }

    const RootNavigator = this.state.rootNavigator;
    return (
      <ApolloProvider client={this.state.apolloClient}>
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <StatusBar backgroundColor="white" barStyle="dark-content"/>
          <RootNavigator/>
        </View>
      </ApolloProvider>
    );
  }
}
