import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';
import * as Strings from '~/common/strings';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import * as Utilities from '~/common/utilities';

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
  background-color: #272727;
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

const STYLES_CONTAINER = css`
  background: ${Constants.colors.background};
  width: 100%;
`;

const STYLES_LOG_CONTAINER = css`
  background: ${Constants.colors.background};
  width: 100%;
  display: flex;
  height: 172px;
  min-height: 96px;
  flex-direction: column;
`;

const STYLES_LEFT_ACTIONS = css`
  padding-left: 16px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  display: flex;
`;

const STYLES_METADATA = css`
  padding: 16px 16px 0 16px;
  height: 172px;
  min-height: 96px;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_CREATOR_LINK = css`
  cursor: pointer;
  font-weight: 400;
  font-family: ${Constants.font.monobold};
  transition: 200ms ease color;
  color: ${Constants.colors.white};

  :hover {
    color: ${Constants.colors.brand2};
  }

  :visited {
    color: ${Constants.colors.white};
  }
`;

const STYLES_DESCRIPTION = css`
  margin: 16px 0 16px 0;
  overflow-wrap: break-word;
  white-space: pre-wrap;
`;

export default class NowPlayingBar extends React.Component {
  state = {
    isMuted: false,
  };

  _handleViewSource = (gameEntryPoint) => {
    NativeUtil.openExternalURL(Urls.githubUserContentToRepoUrl(gameEntryPoint));
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
        <div
          className={STYLES_CONTAINER}
          onClick={this._handleNavigatePlaying}
          style={{ cursor: 'pointer' }}>
          <span className={STYLES_GAME_STRIP}>
            <span className={STYLES_GAME_STRIP_LEFT}>► Return to {title}</span>
          </span>
        </div>
      );
    }

    let maybeViewSource;
    const entryPoint = Utilities.getLuaEntryPoint(game);
    if (Urls.isOpenSource(entryPoint)) {
      maybeViewSource = (
        <UINavigationLink
          style={{ marginRight: 24 }}
          onClick={() => this._handleViewSource(entryPoint)}>
          View Source
        </UINavigationLink>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_GAME_STRIP}>
          <div className={STYLES_GAME_STRIP_LEFT}>{muteElement}</div>
          <div className={STYLES_GAME_STRIP_RIGHT}>
            {maybeViewSource}
            <UINavigationLink style={{ marginRight: 20 }} onClick={this._handleCloseGame}>
              End game
            </UINavigationLink>
          </div>
        </div>
      </div>
    );
  }
}
