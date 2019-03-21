import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import ContentContainer from '~/components/ContentContainer.js';
import SocialContainer from '~/components/SocialContainer.js';

const STYLES_CONTAINER = css`
  font-family: ${Constants.font.default};
  background: ${Constants.colors.background};
  height: 100vh;
  width: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  display: flex;
`;

export default class AppContainer extends React.Component {
  _container;

  updateGameWindowFrame = () => {
    if (!this._container) {
      return;
    }

    this._container.updateGameWindowFrame();
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <SocialContainer isVisible={!this.props.isFullScreen} />
        <ContentContainer
          isNowPlayingVisible={!this.props.isFullScreen}
          ref={(c) => {
            this._container = c;
          }}
          {...this.props}
        />
      </div>
    );
  }
}
