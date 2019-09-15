// Implemented by 'GhostView.m'.

import React from 'react';
import { requireNativeComponent, View } from 'react-native';

const NativeGhostView = requireNativeComponent('GhostView', null);

export default class GhostView extends React.Component {
  state = {
    // Screen dimensions settings given by the game
    screenSettings: {
      width: 800,
      height: 450,
      upscaling: 'on',
      downscaling: 'on',
    },

    // Whether screen dimensions state is ready
    screenReady: false,

    // Will be filled-in in `_handleOnLayout`
    screenScaling: null,
    applyScreenScaling: null,
    screenStyles: null,
  };

  render() {
    const { style, uri } = this.props;
    return (
      <View
        style={{
          ...style,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onLayout={this._handleOnLayout}>
        {this.state.screenReady ? (
          <View style={{ ...this.state.screenStyles }}>
            <NativeGhostView
              style={{ width: '100%', height: '100%' }}
              uri={uri}
              screenScaling={this.state.screenScaling}
              applyScreenScaling={this.state.applyScreenScaling}
            />
          </View>
        ) : null}
      </View>
    );
  }

  _handleOnLayout = ({
    nativeEvent: {
      layout: { width: frameWidth, height: frameHeight },
    },
  }) => {
    // Based on `ghostGetGameFrame` in 'ghost.cpp'

    const settings = this.state.screenSettings;

    let screenScaling, applyScreenScaling, width, height;

    if (settings.width == 0 && settings.height == 0) {
      // Full dimensions
      screenScaling = 1;
      applyScreenScaling = false;
      width = '100%';
      height = '100%';
    } else {
      // Fixed dimensions
      applyScreenScaling = true;
      if (frameWidth < settings.width || frameHeight < settings.height) {
        // Down
        if (settings.downscaling == 'off') {
          screenScaling = 1;
        } else if (settings.downscaling == 'on') {
          screenScaling = Math.min(frameWidth / settings.width, frameHeight / settings.height);
        } else if (settings.downscaling == 'step') {
          const scale = Math.min(frameWidth / settings.width, frameHeight / settings.height);
          screenScaling = 1;
          while (screenScaling > 0.125 && screenScaling > scale) {
            screenScaling *= 0.5;
          }
        }
      } else {
        // Up
        if (settings.upscaling == 'off') {
          screenScaling = 1;
        } else if (settings.upscaling == 'on') {
          screenScaling = Math.min(frameWidth / settings.width, frameHeight / settings.height);
        } else if (settings.upscaling == 'step') {
          screenScaling = Math.floor(
            Math.min(frameWidth / settings.width, frameHeight / settings.height)
          );
        }
      }

      width = Math.min(screenScaling * settings.width, frameWidth);
      height = Math.min(screenScaling * settings.height, frameHeight);
    }

    this.setState({
      screenReady: true,
      screenScaling,
      applyScreenScaling,
      screenStyles: { width, height },
    });
  };
}
