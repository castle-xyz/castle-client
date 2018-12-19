import React from 'React';
import GhostView from './GhostView';
import { Button as RNButton, View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const DEFAULT_GAME_URI =
  'https://raw.githubusercontent.com/nikki93/procjam-oct-2018/4fe417f846c5d752adcac59f56e64e823116dfe1/main.lua';

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
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderColor: '#ddd',
              borderRadius: 4,
              borderWidth: 1,
              padding: 4,
            }}
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
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: 1,
            }}
            onPress={() => this.setState(({ loadCounter }) => ({ loadCounter: loadCounter + 1 }))}>
            <FontAwesome name="refresh" size={16} color="black" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <GhostView
            key={this.state.loadCounter}
            style={{ backgroundColor: 'black', width: '100%', height: '100%' }}
            uri={this.state.viewedUri}
          />
        </View>
      </View>
    );
  }
}
