import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';
import * as Strings from '~/common/strings';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import * as Utilities from '~/common/utilities';

import { DevelopmentContext } from '~/contexts/DevelopmentContext';
import { NativeBinds } from '~/native/nativebinds';
import { css } from 'react-emotion';

import DevelopmentLogs from '~/components/game/DevelopmentLogs';
import UIButtonDarkSmall from '~/components/reusable/UIButtonDarkSmall';
import UINavigationLink from '~/components/reusable/UINavigationLink';

const STYLES_BUTTON = css`
  height: 32px;
  width: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  :hover {
    color: ${Constants.colors.brand2};
  }

  svg {
    transform: scale(1);
    transition: 200ms ease transform;

    :hover {
      transform: scale(1.1);
    }
  }
`;

const STYLES_GAME_STRIP = css`
  height: 32px;
  width: 100%;
  color: ${Constants.colors.white};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_GAME_STRIP_LEFT = css`
  font-family: ${Constants.font.mono};
  min-width: 25%;
  width: 100%;
  padding: 0 24px 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 11px;
  line-height: 10px;
  letter-spacing: 0.1px;
  text-transform: uppercase;
  white-space: nowrap;
`;

const STYLES_GAME_STRIP_RIGHT = css`
  flex-shrink: 0;
  padding: 0 12px 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
`;

const STYLES_CONTAINER_FULL = css`
  background: #232323;
  width: 100%;
  cursor: pointer;

  :hover {
    background: magenta;
  }
`;

const STYLES_CONTAINER = css`
  background: #232323;
  width: 100%;
`;

const STYLES_DEVELOPER_PANE_CHOICE = css`
  background: #313131;
  color: #fff;
  height: 100%;
  padding: 0 24px 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export default class NowPlayingBar extends React.Component {
  static contextType = DevelopmentContext;

  state = {
    isMuted: false,
  };

  _handleToggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isMuted = !this.state.isMuted;
    NativeUtil.sendLuaEvent('CASTLE_SET_VOLUME', isMuted ? 0 : 1);
    this.setState({ isMuted });
  };

  _handleNavigatePlaying = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (this.props.mode !== 'game') {
      this.props.navigator.navigateToCurrentGame();
      return;
    }

    this.props.navigator.navigateToHome();
  };

  _handleCloseGame = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.props.navigator.clearCurrentGame();
  };

  _handleShowDeveloper = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.props.onSetDeveloper(!this.context.isDeveloping);
  };

  render() {
    const { game } = this.props;

    let muteIcon = this.state.isMuted ? <SVG.Mute height="14px" /> : <SVG.Audio height="14px" />;
    let muteElement = (
      <span className={STYLES_BUTTON} onClick={this._handleToggleMute}>
        {muteIcon}
      </span>
    );

    let color;
    let backgroundColor;
    if (game.metadata && game.metadata.primaryColor) {
      backgroundColor = `#${game.metadata.primaryColor}`;
      color = Constants.colors.white;
    }

    let title = 'Untitled';
    if (game) {
      title = game.title ? `${game.title}` : title;
    }

    if (this.props.mode !== 'game') {
      return (
        <div className={STYLES_CONTAINER_FULL} onClick={this._handleNavigatePlaying}>
          <span className={STYLES_GAME_STRIP}>
            <span className={STYLES_GAME_STRIP_LEFT}>► Return to {title}</span>
          </span>
        </div>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_GAME_STRIP}>
          <div
            className={STYLES_DEVELOPER_PANE_CHOICE}
            style={{ backgroundColor: this.context.isDeveloping ? `#020202` : null }}
            onClick={this._handleShowDeveloper}>
            <UINavigationLink>{!this.context.isDeveloping ? `Develop` : `Close`}</UINavigationLink>
          </div>
          <div className={STYLES_GAME_STRIP_LEFT}>{muteElement}</div>
          <div className={STYLES_GAME_STRIP_RIGHT}>
            <UINavigationLink style={{ marginRight: 20 }} onClick={this._handleCloseGame}>
              End game
            </UINavigationLink>
          </div>
        </div>
      </div>
    );
  }
}
