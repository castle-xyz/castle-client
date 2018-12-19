import React from 'React';
import GhostView from './GhostView';
import { Button as RNButton, View, TextInput } from 'react-native';

import Styles from './Styles';

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
        <TextInput
          style={Styles.urlBar}
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

        <View style={{ flex: 1 }}>
          <GhostView
            key={this.state.loadCounter}
            style={{ width: '100%', height: '100%' }}
            uri={this.state.viewedUri}
          />
        </View>
      </View>
    );
  }
}
