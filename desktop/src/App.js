import * as React from 'react';
import { css } from 'react-emotion';
import { isKeyHotkey } from 'is-hotkey';

import * as Actions from '~/common/actions';
import * as Browser from '~/common/browser';
import * as Constants from '~/common/constants';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import {
  DevelopmentContextConsumer,
  DevelopmentContextProvider,
} from '~/contexts/DevelopmentContext';
import { SocialContext } from '~/contexts/SocialContext';
import Logs from '~/common/logs';
import { NavigationContext } from '~/contexts/NavigationContext';
import { NavigatorContext } from '~/contexts/NavigatorContext';
import * as NativeUtil from '~/native/nativeutil';
import * as Strings from '~/common/strings';
import * as Urls from '~/common/urls';
import { linkify } from 'react-linkify';

import ContentContainer from '~/components/ContentContainer.js';
import SocialContainer from '~/components/SocialContainer.js';

const isReloadHotkey = isKeyHotkey('mod+r');
const isFullscreenHotkey = isKeyHotkey('mod+shift+f');
const isDevelopmentHotkey = isKeyHotkey('mod+j');

const NATIVE_CHANNELS_POLL_INTERVAL = 300;

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

class App extends React.Component {
  _nativeChannelsPollTimeout;

  constructor(props) {
    super();

    this.state = props.state;
    ['navigator', 'currentUser', 'social'].forEach((contextName) => {
      this._applyContextFunctions(contextName);
    });
  }

  componentDidMount() {
    window.addEventListener('nativeOpenUrl', this._handleNativeOpenUrlEvent);
    window.addEventListener('keydown', this._handleKeyDownEvent);
    window.addEventListener('CASTLE_SYSTEM_KEY_PRESSED', this._handleLuaSystemKeyDownEvent);
    window.addEventListener('nativeUpdateAvailable', this._handleNativeUpdateAvailableEvent);

    NativeUtil.setBrowserReady(() => {
      this._processNativeChannels();
    });

    linkify.add('castle:', 'http:').add('castles:', 'https:');
    window.onclick = (e) => {
      if (e.target.localName == 'a') {
        e.preventDefault();

        let url = e.target.href;
        if (url.startsWith('castle') || url.endsWith('.castle')) {
          this.navigateToGameUrl(url);
        } else {
          NativeUtil.openExternalURL(url);
        }
      }
    };
  }

  componentWillUnmount() {
    window.removeEventListener('nativeOpenUrl', this._handleNativeOpenUrlEvent);
    window.removeEventListener('keydown', this._handleKeyDownEvent);
    window.removeEventListener('CASTLE_SYSTEM_KEY_PRESSED', this._handleLuaSystemKeyDownEvent);
    window.clearTimeout(this._nativeChannelsPollTimeout);
  }

  // the App component uses its own state as the value for our ContextProviders.
  // for Contexts which include methods, this allows us to provide App's implementation
  // of those methods.
  // for example, this.state.navigator.navigateToGame = this.navigateToGame
  _applyContextFunctions = (contextName) => {
    const context = this.state[contextName];
    Object.getOwnPropertyNames(context).forEach((prop) => {
      if (typeof context[prop] === 'function' && this.hasOwnProperty(prop)) {
        this.state[contextName][prop] = this[prop];
      }
    });
  };

  // interface with lua channels
  _processNativeChannels = async () => {
    await NativeUtil.readLogChannelsAsync();
    const logs = Logs.consume();

    if (logs && logs.length) {
      this.props.development.addLogs(logs);
    }

    this._nativeChannelsPollTimeout = window.setTimeout(
      this._processNativeChannels,
      NATIVE_CHANNELS_POLL_INTERVAL
    );
  };

  // event listeners
  _handleNativeOpenUrlEvent = (e) => {
    this.navigateToGameUrl(e.params.url);
  };

  _handleLuaSystemKeyDownEvent = async (e) => {
    await Actions.delay(10);
    this._handleKeyDownEvent({ ...e.params, preventDefault() {} });
  };

  _handleNativeUpdateAvailableEvent = async ({ params }) => {
    // TODO: Make a non-janky UI
    window.removeEventListener('nativeUpdateAvailable', this._handleNativeUpdateAvailableEvent);
    if (confirm(`update available: ${JSON.stringify(params, null, 2)}\ninstall?`)) {
      await NativeUtil.installUpdate();
    } else {
      await Actions.delay(3 * 3600 * 1000); // 3 hours
      window.addEventListener('nativeUpdateAvailable', this._handleNativeUpdateAvailableEvent);
    }
  };

  _handleKeyDownEvent = (e) => {
    if (isReloadHotkey(e)) {
      return this.reload(e);
    }
    if (isFullscreenHotkey(e)) {
      (async () => {
        NativeUtil.setWindowFrameFullscreen(!(await NativeUtil.getWindowFrameFullscreen()));
      })();
      return;
    }
    if (isDevelopmentHotkey(e)) {
      return this.props.development.setIsDeveloping(!this.props.development.isDeveloping);
    }
  };

  reload = async (e) => {
    if (e) {
      e.preventDefault();
    }
    this.navigateToGameUrl(this.state.navigation.game.url);
  };

  // load game
  _loadGameAsync = async (game) => {
    let { url } = game;
    if (Strings.isEmpty(url)) {
      return;
    }
    const time = Date.now();
    this.setState({
      navigation: {
        ...this.state.navigation,
        contentMode: 'game',
        game,
        gameUrl: url,
        timeGameLoaded: time,
        timeLastNavigated: time,
      },
    });
    const isLocal = Urls.isPrivateUrl(url);
    this.props.development.setIsDeveloping(isLocal);
  };

  // navigator actions
  _navigateToContentMode = (mode) => {
    this.setState({
      navigation: {
        ...this.state.navigation,
        contentMode: mode,
        timeLastNavigated: Date.now(),
      },
    });
  };

  navigateToHome = () => this._navigateToContentMode('home');

  navigateToCurrentGame = () => {
    if (!this.state.navigation.game) {
      throw new Error(`Cannot navigate to current game because there is no current game.`);
    }
    this._navigateToContentMode('game');
  };

  navigateToGameUrl = async (gameUrl) => {
    gameUrl = gameUrl.replace('castle://', 'http://');
    let game;
    try {
      game = await Browser.resolveGameAtUrlAsync(gameUrl);
    } catch (e) {
      // forward this error to the user
      Logs.error(e.message);
      return;
    }

    if (game && game.url) {
      this._loadGameAsync(game);
    } else {
      Logs.error(`There was a problem opening the game at this url: ${gameUrl}`);
    }
  };

  navigateToGame = (game) => {
    if (!game || Strings.isEmpty(game.url)) {
      return;
    }
    if (game.gameId) {
      // this is a known game object, not an abstract url request
      this._loadGameAsync(game);
    } else {
      // this is an incomplete game object, so try to resolve it before loading
      this.navigateToGameUrl(game.url);
    }
  };

  navigateToCurrentUserProfile = () => {
    if (this.state.currentUser.user) {
      this.navigateToUserProfile(this.state.currentUser.user);
      this.refreshCurrentUser();
    } else {
      // show sign in
      this._navigateToContentMode('signin');
    }
  };

  navigateToUserProfile = async (user) => {
    let fullUser = this.state.social.userIdToUser[user.userId];
    if (!fullUser) {
      try {
        fullUser = await Actions.getUser({ userId: user.userId });
        this.state.social.addUser(fullUser);
      } catch (e) {
        // fall back to whatever we were given
        fullUser = user;
      }
    }
    this.setState({
      navigation: {
        ...this.state.navigation,
        contentMode: 'profile',
        userProfileShown: fullUser,
        timeLastNavigated: Date.now(),
      },
    });
  };

  // currentUser actions
  setCurrentUser = (user) => {
    this.setState(
      {
        currentUser: {
          ...this.state.currentUser,
          user,
        },
      },
      () => {
        if (user) {
          this.navigateToCurrentUserProfile();
        } else {
          this.navigateToHome();
        }
      }
    );
  };

  clearCurrentUser = () => {
    if (!Actions.logout()) {
      return;
    }
    this.setState(
      {
        currentUser: {
          ...this.state.currentUser,
          user: null,
          userStatusHistory: [],
        },
      },
      () => {
        this.navigateToCurrentUserProfile();
      }
    );
  };

  refreshCurrentUser = async () => {
    const viewer = await Actions.getViewer();
    if (!viewer) {
      return;
    }
    const userStatusHistory = await Actions.getUserStatusHistory(viewer.userId);
    this.state.social.userIdToUser[viewer.userId] = viewer;
    const updates = {
      currentUser: {
        ...this.state.currentUser,
        user: viewer,
        userStatusHistory,
      },
      social: {
        ...this.state.social,
        userIdToUser: this.state.social.userIdToUser,
      },
    };
    const userProfileShown = this.state.navigation.userProfileShown;
    if (viewer && userProfileShown && viewer.userId === userProfileShown.userId) {
      updates.navigation = {
        ...this.state.navigation,
        userProfileShown: viewer,
      };
    }
    this.setState(updates);
  };

  // social actions
  addUser = (user) => {
    this.setState((state) => {
      state.social.userIdToUser[user.userId] = user;
      return {
        social: {
          ...this.state.social,
          userIdToUser: state.social.userIdToUser,
        },
      };
    });
  };

  addUsers = (users) => {
    this.setState((state) => {
      users.forEach((user) => {
        state.social.userIdToUser[user.userId] = user;
      });

      return {
        social: {
          ...this.state.social,
          userIdToUser: state.social.userIdToUser,
        },
      };
    });
  };

  setOnlineUserIds = (userIds) => {
    this.setState({
      social: {
        ...this.state.social,
        onlineUserIds: userIds,
      },
    });
  };

  render() {
    return (
      <NavigatorContext.Provider value={this.state.navigator}>
        <NavigationContext.Provider value={this.state.navigation}>
          <CurrentUserContext.Provider value={this.state.currentUser}>
            <SocialContext.Provider value={this.state.social}>
              <div className={STYLES_CONTAINER}>
                <SocialContainer />
                <ContentContainer
                  featuredGames={this.state.featuredGames}
                  allContent={this.state.allContent}
                />
              </div>
            </SocialContext.Provider>
          </CurrentUserContext.Provider>
        </NavigationContext.Provider>
      </NavigatorContext.Provider>
    );
  }
}

class AppWithContext extends React.Component {
  render() {
    return (
      <DevelopmentContextConsumer>
        {(development) => <App development={development} {...this.props} />}
      </DevelopmentContextConsumer>
    );
  }
}

export default class AppWithProvider extends React.Component {
  render() {
    return (
      <DevelopmentContextProvider>
        <AppWithContext {...this.props} />
      </DevelopmentContextProvider>
    );
  }
}
