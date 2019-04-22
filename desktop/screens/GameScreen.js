import * as React from 'react';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as Utilities from '~/common/utilities';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';

import GameActionsBar from '~/components/game/GameActionsBar';
import GameWindow from '~/native/gamewindow';
import Logs from '~/common/logs';

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
    // This resize happens at the native level but Windows still needs some adjustment
    if (Utilities.isWindows()) {
      window.addEventListener('resize', this.updateGameWindowFrame);
    }
  }

  componentDidMount() {
    this.updateGameWindowFrame();
  }

  componentDidUpdate(prevProps, prevState) {
    this._updateGameWindow(prevProps, prevState);
  }

  componentWillUnmount() {
    // don't call GameWindow.close(), because we might just be hiding the game.
    GameWindow.setVisible(false);
    window.removeEventListener('resize', this.updateGameWindowFrame);
  }

  _closeGame = async () => {
    // close window
    await GameWindow.close();
  };

  _openGame = async (url) => {
    Logs.system(`Loading game entry point: ${url}`);
    await GameWindow.open({
      gameUrl: url,
      game: this.props.game,
      navigations: {
        navigateToEditPost: this.props.navigateToEditPost,
      },
    });

    // Sync state for new Ghost instance
    NativeUtil.sendLuaEvent('CASTLE_SET_VOLUME', this.state.isMuted ? 0 : 1);
    NativeUtil.sendLuaEvent('CASTLE_SET_IS_LOGGED_IN', this.props.isLoggedIn);
    if (this.props.isLoggedIn) {
      const me = this.props.me;
      NativeUtil.sendLuaEvent('CASTLE_SET_ME', {
        userId: me.userId,
        username: me.username,
        name: me.name,
        photoUrl: me.photo.url,
      });
    }
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
    this.updateGameWindowFrame();
  };

  updateGameWindowFrame = () => {
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
    let actionsBarElement;
    if (!this.props.isFullScreen) {
      actionsBarElement = (
        <GameActionsBar
          game={this.props.game}
          timeGameLoaded={this.props.timeGameLoaded}
          navigateToUserProfile={this.props.navigateToUserProfile}
          clearCurrentGame={this.props.clearCurrentGame}
          onFullScreenToggle={() => this.props.setIsFullScreen(!this.props.isFullScreen)}
          reloadGame={this.props.reloadGame}
          onUpdateGameWindowFrame={this.updateGameWindowFrame}
        />
      );
    }
    return (
      <div className={STYLES_CONTAINER}>
        <div
          className={STYLES_GAME_CONTAINER}
          ref={(ref) => {
            this._gameContainerReference = ref;
            this.updateGameWindowFrame();
          }}
        />
        {actionsBarElement}
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
                    navigateToEditPost={navigator.navigateToEditPost}
                    isFullScreen={navigation.isFullScreen}
                    setIsFullScreen={navigator.setIsFullScreen}
                    reloadGame={navigator.reloadGame}
                    clearCurrentGame={navigator.clearCurrentGame}
                    isLoggedIn={currentUser.user !== null}
                    me={currentUser.user}
                    {...this.props}
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
