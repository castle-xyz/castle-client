import * as React from 'react';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as Utilities from '~/common/utilities';
import * as Actions from '~/common/actions';

import { css } from 'react-emotion';
import { NativeBinds } from '~/native/nativebinds';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';

import GLLoaderScreen from '~/isometric/components/GLLoaderScreen';
import GameWindow from '~/native/gamewindow';
import Logs from '~/common/logs';
import Game from '~/components/game/Game';
import { jsUserToLuaUser, jsPostToLuaPost, jsGameToLuaGame } from '~/common/bridge';

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;
  background: #000000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_CONTAINER_THEATER = css`
  position: fixed;
  z-index: 1;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_LOADING_OVERLAY_CONTAINER = css`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 14px;
`;

const STYLES_LOADING_OVERLAY_ELEMENT = css`
  font-family: ${Constants.font.mono};
  color: ${Constants.logs.system};
  font-size: 10px;
`;

class GameScreen extends React.Component {
  static defaultProps = {
    game: null,
    timeGameLoaded: 0,
    isLoggedIn: false,
    navigateToUserProfile: null,
  };

  _game = null;
  _tools = null;

  state = {
    isMuted: false,
    loaded: true,
    recordingStatus: {
      status: 'ready',
    },
    luaNetworkRequests: [
      // Some example data to test with in the browser
      // {
      //   method: 'GET',
      //   url: 'https://github.com/schazers/badboxart/commits/master',
      //   id: 1,
      // },
      // {
      //   method: 'GET',
      //   url: 'https://github.com/schazers/badboxart/commits/kek',
      //   id: 2,
      // },
    ],
    loadingPhase: 'initializing',
  };

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
    GameWindow.updateSetRecordingStatus(this._setRecordingStatus);
    window.addEventListener('CASTLE_GAME_LOADED', this._handleGameLoaded);
    window.addEventListener('GHOST_NETWORK_REQUEST', this._handleLuaNetworkRequest);
    document.addEventListener('CASTLE_GAME_LAYOUT_UPDATE', this.updateGameWindowFrame);
  }

  componentDidUpdate(prevProps, prevState) {
    this._updateGameWindow(prevProps, prevState);
  }

  componentWillUnmount() {
    // don't call GameWindow.close(), because we might just be hiding the game.
    GameWindow.setVisible(false);
    window.removeEventListener('resize', this.updateGameWindowFrame);
    window.removeEventListener('CASTLE_GAME_LOADED', this._handleGameLoaded);
    window.removeEventListener('GHOST_NETWORK_REQUEST', this._handleLuaNetworkRequest);
    document.removeEventListener('CASTLE_GAME_LAYOUT_UPDATE', this.updateGameWindowFrame);
  }

  _prepareInitialGameData = async (screenSettings) => {
    // Prepare the Lua format of the post
    const luaPost = this.props.post
      ? await jsPostToLuaPost(this.props.post, { data: true })
      : undefined;

    return {
      graphics: {
        width: screenSettings.width,
        height: screenSettings.height,
      },
      audio: {
        volume: this.state.isMuted ? 0 : 1,
      },
      user: {
        isLoggedIn: this.props.isLoggedIn,
        me: await jsUserToLuaUser(this.props.me),
      },
      initialPost: luaPost,
      initialParams: this.props.gameParams ? this.props.gameParams : undefined,
      game: this.props.game ? await jsGameToLuaGame(this.props.game) : undefined,
      referrerGame: this.props.referrerGame
        ? await jsGameToLuaGame(this.props.referrerGame)
        : undefined,
    };
  };

  _handleGameLoaded = () => {
    GameWindow.setVisible(true);
    this.setState({ loaded: true });
  };

  _handleLuaNetworkRequest = async (e) => {
    const { type, id, url, method } = e.params;
    if (type == 'start') {
      this.setState(({ luaNetworkRequests }) => ({
        luaNetworkRequests: !luaNetworkRequests.find((req) => req.url == url)
          ? [...luaNetworkRequests, { id, url, method }]
          : luaNetworkRequests,
        loadingPhase: 'loading',
      }));
    } else if (type == 'stop') {
      await Actions.delay(60);
      this.setState(({ luaNetworkRequests }) => ({
        luaNetworkRequests: luaNetworkRequests.filter((req) => req.id !== id),
      }));
    }
  };

  _closeGame = async () => {
    if (this._tools) {
      this._tools.clearState();
    }

    // close window
    await GameWindow.close();
  };

  _setRecordingStatus = (recordingStatus) => {
    this.setState({ recordingStatus });
  };

  _openGame = async (url, game) => {
    await new Promise((resolve) =>
      this.setState(
        { loaded: false, luaNetworkRequests: [], loadingPhase: 'initializing' },
        resolve
      )
    );

    if (this._tools) {
      this._tools.clearState();
    }

    Logs.system(`Loading game entry point: ${url}`);
    const screenSettings = Utilities.getScreenSettings(game);
    const initialData = await this._prepareInitialGameData(screenSettings);

    // Sync initial window size
    await this.updateGameWindowFrame();

    // Launch the game window, passing all of the initial settings
    await GameWindow.open({
      gameUrl: url,
      game: game,
      navigations: {
        navigateToEditPost: this.props.navigateToEditPost,
        navigateToGameUrl: this.props.navigateToGameUrl,
        navigateToGame: this.props.navigateToGame,
      },
      initialData,
      screenSettings,
    });

    // Triger the `castle.postopened` event afterward
    if (initialData.initialPost) {
      NativeUtil.sendLuaEvent('CASTLE_POST_OPENED', initialData.initialPost);
    }

    // load newest playing/making user status (don't await)
    this.props.refreshCurrentUser();
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
      await this._openGame(newUrl, this.props.game);
    } else if (newUrl === oldUrl && this.props.timeGameLoaded !== prevProps.timeGameLoaded) {
      // reload
      await this._closeGame();
      await this._openGame(oldUrl, prevProps.game);
    }
    this.updateGameWindowFrame();
  };

  updateGameWindowFrame = async () => {
    if (!this._game) {
      return;
    }

    const rect = this._game.getBoundingClientRect();
    if (!rect) {
      return;
    }

    await GameWindow.updateFrame(rect);
    if (this.state.loaded) {
      await GameWindow.setVisible(true);
    }
  };

  _handleToggleMute = () => {
    const isMuted = !this.state.isMuted;
    NativeUtil.sendLuaEvent('CASTLE_SET_VOLUME', isMuted ? 0 : 1);
    this.setState({ isMuted });
  };

  _handleGameMaximize = () => {
    this.props.setIsFullScreen(!this.props.isFullScreen);
  };

  _handleGameMinimize = () => {
    this.props.setIsFullScreen(false);
    this.props.minimizeGame();
  };

  _setGameRef = (ref) => {
    this._game = ref;
  };

  _setToolsRef = (ref) => {
    this._tools = ref;
  };

  _renderLoader = () => {
    const { luaNetworkRequests, loadingPhase, loaded } = this.state;

    let maybeLoadingAnimation, maybeLoadingOverlay;
    if (!loaded) {
      maybeLoadingAnimation = <GLLoaderScreen />;

      maybeLoadingOverlay = (
        <div className={STYLES_LOADING_OVERLAY_CONTAINER}>
          {luaNetworkRequests.length > 0 ? (
            luaNetworkRequests.map(({ url }) => (
              <div className={STYLES_LOADING_OVERLAY_ELEMENT}>Fetching {url}...</div>
            ))
          ) : loadingPhase === 'initializing' ? (
            <div className={STYLES_LOADING_OVERLAY_ELEMENT}>Initializing system...</div>
          ) : (
            <div className={STYLES_LOADING_OVERLAY_ELEMENT}>Starting game...</div>
          )}
        </div>
      );
    }

    return (
      <React.Fragment>
        {maybeLoadingOverlay}
        {maybeLoadingAnimation}
      </React.Fragment>
    );
  };

  render() {
    let screenClassName = STYLES_CONTAINER;
    if (this.props.isFullScreen) {
      screenClassName = STYLES_CONTAINER_THEATER;
    }

    return (
      <Game
        onSetToolsRef={this._setToolsRef}
        game={this.props.game}
        sessionId={this.props.sessionId}
        isFullScreen={this.props.isFullScreen}
        isMuted={this.state.isMuted}
        recordingStatus={this.state.recordingStatus}
        navigateToUserProfile={this.props.navigateToUserProfile}
        navigateToGameUrl={this.props.navigateToGameUrl}
        navigateToGame={this.props.navigateToGame}
        navigateToHome={this.props.navigateToHome}
        onGameDismiss={this.props.clearCurrentGame}
        onGameMaximize={this._handleGameMaximize}
        onGameMinimize={this._handleGameMinimize}
        onToggleMute={this._handleToggleMute}
        onCreatePost={this.props.navigateToEditPost}
        onReload={this.props.reloadGame}
        onWindowSizeUpdate={this.updateGameWindowFrame}
        refreshCurrentUser={this.props.refreshCurrentUser}>
        <div ref={this._setGameRef} className={screenClassName}>
          {this._renderLoader()}
        </div>
      </Game>
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
                    sessionId={navigation.sessionId}
                    post={navigation.post}
                    gameParams={navigation.gameParams}
                    referrerGame={navigation.referrerGame}
                    timeGameLoaded={navigation.timeGameLoaded}
                    timeNavigatedToGame={navigation.timeLastNavigated}
                    navigateToUserProfile={navigator.navigateToUserProfile}
                    navigateToEditPost={navigator.navigateToEditPost}
                    navigateToGameUrl={navigator.navigateToGameUrl}
                    navigateToGame={navigator.navigateToGame}
                    navigateToHome={navigator.navigateToHome}
                    minimizeGame={navigator.minimizeGame}
                    isFullScreen={navigation.isFullScreen}
                    setIsFullScreen={navigator.setIsFullScreen}
                    reloadGame={navigator.reloadGame}
                    clearCurrentGame={navigator.clearCurrentGame}
                    isLoggedIn={currentUser.user !== null}
                    me={currentUser.user}
                    refreshCurrentUser={currentUser.refreshCurrentUser}
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
