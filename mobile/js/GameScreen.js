import { Linking } from 'expo';
import React from 'React';
import GhostView from './GhostView';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { gql, Query, isSignedInAsync } from './Conn';
import { navigate } from './Navigation';

const DEFAULT_GAME_URI =
  'https://raw.githubusercontent.com/castle-games/ghost-tests/master/screensize/main.lua';
// const DEFAULT_GAME_URI =
//   'https://raw.githubusercontent.com/nikki93/edit-world/master/main_local.lua';

let mountedInstance = null; // Ref to currently mounted `GameScreen` instance, if any

let linkingUri = null; // Last posted linking URI

// Consume posted linking URI
async function consumeUri() {
  if (linkingUri !== null) {
    if (mountedInstance) {
      mountedInstance.openUri(linkingUri);
      linkingUri = null;
    } else if ((await isSignedInAsync()) && navigate('GameScreen', { uri: linkingUri })) {
      linkingUri = null;
    }
    if (linkingUri) {
      setTimeout(consumeUri, 100); // Try again later
    }
  }
}

// Post linking URI when booted with initial URI
(async () => {
  const candidateUri = await Linking.getInitialURL();
  if (candidateUri && candidateUri !== 'castle://') {
    linkingUri = candidateUri;
    consumeUri();
  }
})();

// Post linking URI when foregrounded with URI
Linking.addEventListener('url', ({ url: candidateUri }) => {
  linkingUri = candidateUri;
  consumeUri();
});

// Convert a URI to a simplified title
function simplifyUri(uri) {
  let matches;

  // GitHub raw
  matches = uri.match(/^(castle|https?):\/\/raw\.githubusercontent\.com\/([^/]*)\/([^/]*)\//);
  if (matches) {
    return `${matches[2]}/${matches[3]}`;
  }

  return uri;
}

const widgetStyle = {
  backgroundColor: 'white',
  borderRadius: 4,
  borderWidth: 1,
  borderColor: '#ddd',
};

export default class GameScreen extends React.Component {
  state = {
    viewedUri: null, // Uri that the `GhostView` should display
    editedUri: null, // Uri that the `TextInput` should display
    loadCounter: 0, // To force reloads of `GhostView`
    uriInputFocused: false, // Whether the `TextInput` is focused
    showGhostView: true, // Whether to show the `GhostView` -- `false` to display black instead
  };

  constructor(props, context) {
    super(props, context);

    // Consume possible linking URI sources
    this.state.viewedUri = linkingUri || props.navigation.getParam('uri') || DEFAULT_GAME_URI;
    linkingUri = null;
    this.state.editedUri = this.state.viewedUri;
  }

  componentDidMount() {
    mountedInstance = this;
  }

  componentWillUnmount() {
    mountedInstance = null;
  }

  render() {
    return (
      <View style={{ flex: 1 }} pointerEvents="box-none">
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
          pointerEvents="box-none">
          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                ...widgetStyle,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}>
              <Query
                query={gql`
                  query {
                    me {
                      username
                    }
                  }
                `}>
                {({ loading, data }) =>
                  loading ? <Text>...</Text> : <Text>{data.me.username}</Text>
                }
              </Query>
            </View>

            <View style={{ flex: 1 }}>
              <TextInput
                ref={ref => (this._uriInput = ref)}
                style={{
                  ...widgetStyle,
                  flex: 1,
                  borderColor: '#ddd',
                  padding: 4,
                }}
                onFocus={() => this.setState({ uriInputFocused: true })}
                onBlur={() => this.setState({ uriInputFocused: false })}
                selectTextOnFocus
                returnKeyType="go"
                value={this.state.editedUri}
                placeholder={'enter a castle uri here'}
                onChangeText={text => this.setState({ editedUri: text })}
                onSubmitEditing={() => this.openUri(this.state.editedUri, { forceReload: true })}
              />

              {this.state.uriInputFocused ? null : (
                <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
                  <TouchableOpacity
                    style={{
                      ...widgetStyle,
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => this._uriInput.focus()}>
                    <Text>{simplifyUri(this.state.viewedUri)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={{
                ...widgetStyle,
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: 1,
              }}
              onPress={() => this.openUri(this.state.viewedUri, { forceReload: true })}>
              <FontAwesome name="refresh" size={16} color="black" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

        <View style={{ flex: 1 }}>
          {this.state.showGhostView ? (
            <GhostView
              key={this.state.loadCounter}
              style={{ backgroundColor: 'black', width: '100%', height: '100%' }}
              uri={this.state.viewedUri}
            />
          ) : (
            <View style={{ backgroundColor: 'black', width: '100%', height: '100%' }} />
          )}

          {this.state.uriInputFocused ? (
            <TouchableOpacity
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              }}
              onPress={() => this._uriInput.blur()}
            />
          ) : null}
        </View>
      </View>
    );
  }

  async openUri(uri, { forceReload = false } = {}) {
    if (forceReload || uri !== this._lastOpenedUri) {
      this._lastOpenedUri = uri;
      this.setState({ showGhostView: false });
      await new Promise(resolve => setTimeout(resolve, 200));
      this.setState(({ loadCounter }) => ({
        showGhostView: true,
        editedUri: uri,
        viewedUri: uri,
        loadCounter: loadCounter + 1,
      }));
    }
  }
}
