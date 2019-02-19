import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import GameActionsBar from '~/components/game/GameActionsBar';
import GameWindow from '~/native/gamewindow';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import Logs from '~/common/logs';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';
import * as NativeUtil from '~/native/nativeutil';
import Share from '~/common/share';
import UserStatus from '~/common/userstatus';
import * as Utilities from '~/common/utilities';

const STYLES_CONTAINER = css`
  background: ${Constants.colors.black};
  width: 100%;
  height: 100%;
  position: relative;
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
`;

const STYLES_GAME_CONTAINER = css`
  width: 100%;
  height: 100%;
  position: relative;
  align-items: center;
  justify-content: center;
  display: flex;
`;

class GameScreen extends React.Component {
  static defaultProps = {
    game: null,
    timeGameLoaded: 0,
    isLoggedIn: false,
    navigateToUserProfile: null,
  };
  state = {
    isMuted: false,
  };
  _gameContainerReference = null;

  constructor(props) {
    super(props);
    this._updateGameWindow(null, null);
    // NOTE(nikki): This is handled on the native level if resizes maintain same border widths
    //              on all sides
    //window.addEventListener('resize', this._updateGameWindowFrame);
  }

  componentDidUpdate(prevProps, prevState) {
    this._updateGameWindow(prevProps, prevState);
  }

  componentWillUnmount() {
    // don't call GameWindow.close(), because we might just be hiding the game.
    GameWindow.setVisible(false);
    window.removeEventListener('resize', this._updateGameWindowFrame);
  }

  _closeGame = async () => {
    // close window
    await GameWindow.close();
    UserStatus.stop();
    Share.removeEventListeners();
  };

  _openGame = async (url) => {
    Logs.system(`Loading game entry point: ${url}`);
    amplitude.getInstance().logEvent('OPEN_LUA', {
      url,
    });
    Share.addEventListeners(this.props.game);
    UserStatus.startAsync(this.props.game);
    await GameWindow.open(url);

    // Sync state for new Ghost instance
    NativeUtil.sendLuaEvent('CASTLE_SET_LOGGED_IN', this.props.isLoggedIn);
    NativeUtil.sendLuaEvent('CASTLE_SET_VOLUME', this.state.isMuted ? 0 : 1);
  };

  _updateGameWindow = async (prevProps, prevState) => {
    let newUrl = Utilities.getLuaEntryPoint(this.props.game);
    let oldUrl = prevProps ? Utilities.getLuaEntryPoint(prevProps.game) : null;

    if (!newUrl) {
      // just close old game
      await this._closeGame();
    } else if (!oldUrl && this.props.timeNavigatedToGame !== this.props.timeGameLoaded) {
      // resume previously-loaded game
      // by calling this._updateGameWindowFrame() later.
    } else if (newUrl !== oldUrl) {
      // close game and open new
      await this._closeGame();
      await this._openGame(newUrl);
    } else if (newUrl === oldUrl && this.props.timeGameLoaded !== prevProps.timeGameLoaded) {
      // reload
      await this._closeGame();
      await this._openGame(oldUrl);
    }
    this._updateGameWindowFrame();
  };

  _updateGameWindowFrame = () => {
    if (this._gameContainerReference) {
      const rect = this._gameContainerReference.getBoundingClientRect();
      GameWindow.updateFrame(rect);
      GameWindow.setVisible(true);
    }
  };

  _toggleIsMuted = () => {
    const isMuted = !this.state.isMuted;
    NativeUtil.sendLuaEvent('CASTLE_SET_VOLUME', isMuted ? 0 : 1);
    this.setState({ isMuted });
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div
          className={STYLES_GAME_CONTAINER}
          ref={(ref) => {
            this._gameContainerReference = ref;
            this._updateGameWindowFrame();
          }}
        />
        <GameActionsBar
          game={this.props.game}
          timeGameLoaded={this.props.timeGameLoaded}
          isMuted={this.state.isMuted}
          onToggleMute={this._toggleIsMuted}
          navigateToUserProfile={this.props.navigateToUserProfile}
        />
      </div>
    );
  }
}

export default class GameScreenWithContext extends React.Component {
  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <NavigationContext.Consumer>
            {(navigation) => (
              <CurrentUserContext.Consumer>
                {(currentUser) => (
                  <GameScreen
                    game={navigation.game}
                    timeGameLoaded={navigation.timeGameLoaded}
                    timeNavigatedToGame={navigation.timeLastNavigated}
                    navigateToUserProfile={navigator.navigateToUserProfile}
                    isLoggedIn={currentUser.user !== null}
                  />
                )}
              </CurrentUserContext.Consumer>
            )}
          </NavigationContext.Consumer>
        )}
      </NavigatorContext.Consumer>
    );
  }
}
