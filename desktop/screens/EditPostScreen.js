import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';

import UIButton from '~/components/reusable/UIButton';
import UIHeading from '~/components/reusable/UIHeading';
import ControlledInput from '~/components/primitives/ControlledInput';

const STYLES_CONTAINER = css`
  flex: 1
  background: ${Constants.colors.background};
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  padding: 24px;
  align-items: center;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_SIZER = css`
  max-width: 600px;
`;

const STYLES_INPUT_CONTAINER = css`
  border: 1px solid ${Constants.colors.background4};
  background-color: ${Constants.colors.background};
  border-radius: 4px;
  margin-bottom: 16px;
`;

const STYLES_INPUT = css`
  background: ${Constants.colors.white};
  color: ${Constants.colors.black};
  display: block;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 4px;
  width: 100%;
  border: 2px solid transparent;
  font-size: 16px;
  margin: 0 0 0 0;

  :focus {
    outline: 0;
    border: 2px solid transparent;
  }
`;

const STYLES_MEDIA_CONTAINER = css`
  background-color: ${Constants.colors.white};
  padding: 4px 8px 4px 8px;
`;

const STYLES_MEDIA_IMAGE = css`
  background-color: ${Constants.colors.black};
  object-fit: contain;
  width: 100%;
  max-height: 500px;
`;

const STYLES_ACTIONS = css`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const STYLES_BACK = css`
  display: inline-flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  text-decoration: underline;
  font-size: ${Constants.typescale.lvl6};
  color: ${Constants.colors.text};
  cursor: pointer;
`;

class EditPostScreen extends React.Component {
  constructor(props, context) {
    super(props, context);

    const { message, mediaPath, shouldCrop } = props.editPost;
    console.log(JSON.stringify(props.editPost));

    this.state = {
      message,
      mediaPath,
      shouldCrop,
    };
  }

  componentDidMount() {
    if (this.state.shouldCrop) {
      this._autoCrop();
    }
  }

  _handleChangeMessage = (e) => {
    this.setState({
      message: e.target.value,
    });
  };

  _isValidForSubmit = () => {
    return (
      (typeof this.state.message === 'string' && this.state.message.length > 0) ||
      this.state.mediaPath
    );
  };

  _handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
    this.props.navigateToCurrentGame && this.props.navigateToCurrentGame();
  };

  _handleSubmit = () => {
    if (this._isValidForSubmit()) {
      if (this.props.onSubmit) {
        const { message, editedMediaBlob } = this.state;
        this.props.onSubmit({
          message,
          editedMediaBlob,
        });
      }
      this.props.navigateToCurrentGame && this.props.navigateToCurrentGame();
    }
  };

  _alreadySelectedInputOnce = false;
  _maybeSelectInput = (ref) => {
    if (ref && !this._alreadySelectedInputOnce) {
      ref._input.select();
      this._alreadySelectedInputOnce = true;
    }
  };

  _autoCrop = () => {
    // Start loading image
    const img = document.createElement('img');
    img.src = this.state.mediaPath;

    // Draw original image to this (to read)
    const inputCanvas = document.createElement('canvas');
    const inputCtx = inputCanvas.getContext('2d');

    // Draw edited image to this (to export)
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');

    img.onload = () => {
      // Draw whole image to `inputCanvas`
      inputCanvas.width = img.width;
      inputCanvas.height = img.height;
      inputCtx.drawImage(img, 0, 0, img.width, img.height);

      // Read `ImageData`
      const inputImageData = inputCtx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
      const inputBuf32 = new Uint32Array(inputImageData.data.buffer); // To allow whole-pixel comparisons
      const inputPix = (x, y) => inputBuf32[inputCanvas.width * y + x];

      // NOTE: This could be expanded into an interactive image editor cuz it's a canvas...

      // Top, left
      let top, left;
      const topLeftPix = inputPix(0, 0);
      topLoop: for (let y = 0; y < inputCanvas.height; ++y) {
        for (let x = 0; x < inputCanvas.width; ++x) {
          if (inputPix(x, y) !== topLeftPix) {
            top = y;
            break topLoop;
          }
        }
      }
      leftLoop: for (let x = 0; x < inputCanvas.width; ++x) {
        for (let y = 0; y < inputCanvas.height; ++y) {
          if (inputPix(x, y) !== topLeftPix) {
            left = x;
            break leftLoop;
          }
        }
      }

      // Bottom, right
      let bottom, right;
      const bottomRightPix = inputPix(inputCanvas.width - 1, inputCanvas.height - 1);
      bottomLoop: for (let y = inputCanvas.height - 1; y >= 0; --y) {
        for (let x = 0; x < inputCanvas.width; ++x) {
          if (inputPix(x, y) !== bottomRightPix) {
            bottom = y;
            break bottomLoop;
          }
        }
      }
      rightLoop: for (let x = inputCanvas.width - 1; x >= 0; --x) {
        for (let y = 0; y < inputCanvas.height; ++y) {
          if (inputPix(x, y) !== bottomRightPix) {
            right = x;
            break rightLoop;
          }
        }
      }

      // Draw to cropped canvas
      outputCanvas.width = right - left + 1;
      outputCanvas.height = bottom - top + 1;
      outputCtx.drawImage(
        img,
        left,
        top,
        outputCanvas.width,
        outputCanvas.height,
        0,
        0,
        outputCanvas.width,
        outputCanvas.height
      );

      // Export!
      outputCanvas.toBlob((editedMediaBlob) => {
        const editedMediaObjUrl = URL.createObjectURL(editedMediaBlob);
        this.setState({ editedMediaBlob, editedMediaObjUrl });
      });
    };
  };

  render() {
    let maybeMediaContainer;
    if (!this.state.shouldCrop || this.state.editedMediaObjUrl) {
      maybeMediaContainer = (
        <div className={STYLES_MEDIA_CONTAINER}>
          <img
            className={STYLES_MEDIA_IMAGE}
            src={this.state.shouldCrop ? this.state.editedMediaObjUrl : this.state.mediaPath}
          />
        </div>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_SIZER}>
          <UIHeading>Make a post</UIHeading>
          <div className={STYLES_INPUT_CONTAINER}>
            <ControlledInput
              ref={this._maybeSelectInput}
              autoFocus
              onChange={this._handleChangeMessage}
              onFocus={this._handleFocus}
              onBlur={this._handleBlur}
              placeholder="Say something!"
              value={this.state.message}
              className={STYLES_INPUT}
            />
            {maybeMediaContainer}
          </div>
          <div className={STYLES_ACTIONS}>
            <div className={STYLES_BACK} onClick={this._handleCancel}>
              Cancel
            </div>
            <UIButton disabled={!this._isValidForSubmit()} onClick={this._handleSubmit}>
              Submit
            </UIButton>
          </div>
        </div>
      </div>
    );
  }
}

export default class EditPostScreenWithContext extends React.Component {
  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <NavigationContext.Consumer>
            {(navigation) => {
              const { editPost, onSubmit, onCancel } = navigation.params;

              // Mock data for testing
              // const editPost = {
              //   message: 'hello, world',
              //   mediaPath: '/static/test.png',
              // };
              // const onSubmit = (...args) => console.log('onSubmit', ...args);
              // const onCancel = (...args) => console.log('onCancel', ...args);

              return (
                <EditPostScreen
                  {...this.props}
                  editPost={editPost}
                  onSubmit={onSubmit}
                  onCancel={onCancel}
                  navigateToCurrentGame={navigator.navigateToCurrentGame}
                />
              );
            }}
          </NavigationContext.Consumer>
        )}
      </NavigatorContext.Consumer>
    );
  }
}
