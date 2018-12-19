import React from 'React';
import GhostView from './GhostView';
import { Button as RNButton, View, PanResponder, TextInput } from 'react-native';

import * as GhostChannels from './GhostChannels';
import { textInputStyle } from './Components';

const DEFAULT_GAME_URI =
  'https://raw.githubusercontent.com/expo/sync.lua/master/example_triangle_warz.lua';
// const DEFAULT_GAME_URI = 'http://10.0.1.39:8000/example_triangle_warz.lua';

const Key = ({ left, top, right, bottom, theKey }) => {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => GhostChannels.pushAsync('KEY_PRESSED', theKey),
    onPanResponderRelease: () => GhostChannels.pushAsync('KEY_RELEASED', theKey),
  });

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left,
        top,
        right,
        bottom,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 8,
      }}
    />
  );
};

export default class GameScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerLeft: <RNButton title="Quit" onPress={() => navigation.pop()} color="#666" />,
  });

  state = {
    viewedUri: DEFAULT_GAME_URI,
    editedUri: null,
    loadCounter: 0,
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <TextInput
          style={textInputStyle}
          returnKeyType="go"
          value={this.state.editedUri}
          placeholder={'enter a castle uri here'}
          onChangeText={text => this.setState({ editedUri: text })}
          onSubmitEditing={() =>
            this.setState(({ editedUri, loadCounter }) => ({
              viewedUri: editedUri,
              loadCounter: loadCounter + 1,
            }))}
        />

        <View>
          <GhostView
            key={this.state.loadCounter}
            style={{ width: '100%', height: '100%' }}
            uri={this.state.viewedUri}
          />
        </View>

        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 140,
            height: 100,
            backgroundColor: 'transparent',
          }}>
          <Key left={50} top={5} theKey="w" />
          <Key left={5} top={50} theKey="a" />
          <Key left={50} top={50} theKey="s" />
          <Key right={5} top={50} theKey="d" />
        </View>
      </View>
    );
  }
}
