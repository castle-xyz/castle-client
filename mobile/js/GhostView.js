// Implemented by 'GhostView.m'.

import React from 'react';
import { requireNativeComponent } from 'react-native';

export default class GhostView extends React.Component {
  static Native = requireNativeComponent('GhostView', null);

  state = {
    reloadCounter: 0,
  };

  render() {
    return <GhostView.Native key={this.state.reloadCounter} {...this.props} />;
  }

  reload() {
    this.setState(({ reloadCounter }) => ({ reloadCounter: reloadCounter + 1 }));
  }
}
