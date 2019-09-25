import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Analytics from '~/common/analytics';
import * as Browser from '~/common/browser';
import * as ExecNode from '~/common/execnode';
import * as Strings from '~/common/strings';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import { getSessionLink } from '~/common/utilities';

import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { DevelopmentContext } from '~/contexts/DevelopmentContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import GameWindow from '~/native/gamewindow';
import Logs from '~/common/logs';

/**
 *  NavigationContext is the state of where the app is currently navigated,
 *  i.e. what is being shown to the user right now.
 *
 *  This is the "read" side of NavigatorContext, so methods in NavigatorContext
 *  should have an effect on values here.
 */
const NavigationContextDefaults = {
  contentMode: 'home', // game | gamemeta | profile | home | signin | notifications | create | edit_post
  timeLastNavigated: 0,
  gameUrl: '',
  game: null,
  sessionId: null,
  post: null,
  isChatExpanded: true,
  chatChannelId: null,
  gameMetaChannelId: null, // TODO: ben: decouple from chat, take a game here
  gameParams: null,
  referrerGame: null,
  timeGameLoaded: 0,
  userProfileShown: null,
  isFullScreen: false,
  deferredNavigationState: null, // used when restoring navigation state after login
};

// NOTE(jim): Easy way to enforce signed in routes.
const AUTHENTICATED_ONLY_MODES = {
  chat: true,
  edit_post: true,
  create: true,
  notifications: true,
  history: true,
  posts: false,
  examples: false,
  game: false,
  profile: false,
  home: false,
  signin: false,
};

/**
 *  NavigatorContext contains methods for changing the navigation state of the app.
 *  this is the "write" side of NavigationContext, i.e. methods here should have
 *  an effect on the value of NavigationContext.
 *
 *  Navigator and Navigation are separate because some components only want to change
 *  the state but never read from it.
 */
const NavigatorContextDefaults = {
  openUrl: async (url, options) => {},
  showChatChannel: async (channelId) => {},
  toggleIsChatExpanded: () => {},
  navigateToHome: () => {},
  navigateToGameUrl: async (url, options) => {},
  navigateToGame: async (game, options) => {},
  navigateToGameMeta: (channelId) => {}, // TODO: ben: decouple from chat
  navigateToCurrentGame: () => {},
  navigateToSignIn: () => {},
  navigateToCurrentUserProfile: () => {},
  navigateToContentMode: (mode) => {},
  navigateToUserProfile: async (user) => {},
  navigateToNotifications: () => {},
  navigateToCreate: () => {},
  navigateToEditPost: () => {},
  reloadGame: (onlyIfVisible) => {},
  minimizeGame: () => {},
  clearCurrentGame: async () => {},
  setIsFullScreen: (isFullScreen) => {},
};

const NavigatorContext = React.createContext(NavigatorContextDefaults);
const NavigationContext = React.createContext(NavigationContextDefaults);

class NavigationContextManager extends React.Component {
  _reloadDebounceTimeout;

  constructor(props) {
    super(props);
    this.state = {
      navigation: {
        ...NavigationContextDefaults,
        ...props.value.navigation,
      },
      navigator: {
        ...NavigatorContextDefaults,
        ...props.value.navigator,
        navigateToContentMode: this.navigateToContentMode,
        showChatChannel: this.showChatChannel,
        toggleIsChatExpanded: this.toggleIsChatExpanded,
        navigateToHome: this.navigateToHome,
        navigateToGameUrl: this.navigateToGameUrl,
        navigateToGame: this.navigateToGame,
        navigateToGameMeta: this.navigateToGameMeta,
        navigateToCurrentGame: this.navigateToCurrentGame,
        navigateToCurrentUserProfile: this.navigateToCurrentUserProfile,
        navigateToSignIn: this.navigateToSignIn,
        navigateToUserProfile: this.navigateToUserProfile,
        navigateToNotifications: this.navigateToNotifications,
        navigateToCreate: this.navigateToCreate,
        navigateToEditPost: this.navigateToEditPost,
        openUrl: this.openUrl,
        reloadGame: this.reloadGame,
        minimizeGame: this.minimizeGame,
        clearCurrentGame: this.clearCurrentGame,
        setIsFullScreen: this.setIsFullScreen,
      },
    };
    // we need to listen for game events related to multiplayer session connection
    GameWindow.onOpen((game) => {
      this._addGameEventListeners(game);
    });
    GameWindow.onClose((game) => {
      this._removeGameEventListeners(game);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // user logged out
    if (prevProps.currentUser.user && !this.props.currentUser.user) {
      this.navigateToHome();
    }
    // user logged in
    if (!prevProps.currentUser.user && this.props.currentUser.user) {
      this._restoreDeferredState();
    }

    if (
      prevProps.currentUser.timeLastLoaded !== 0 &&
      prevProps.currentUser.timeLastLoaded !== this.props.currentUser.timeLastLoaded
    ) {
      // current user was refreshed
      const viewer = this.props.currentUser.user;
      if (viewer) {
        this.props.userPresence.addUser(viewer);
        const userProfileShown = this.state.navigation.userProfileShown;
        if (userProfileShown && viewer.userId === userProfileShown.userId) {
          this.setState({
            navigation: {
              ...this.state.navigation,
              userProfileShown: viewer,
            },
          });
        }
      }
    }
  }

  // load game
  _loadGameAsync = async (
    game,
    { post = null, gameParams = null, referrerGame = null, launchSource = null } = {}
  ) => {
    let { url } = game;
    if (Strings.isEmpty(url)) {
      return;
    }

    // if we're navigating from one game to another, make sure to end the first game and properly record
    // the fact that it was closed (and also properly clear game-related properties like sessionId)
    if (this.state.navigation.game !== NavigationContextDefaults.game) {
      await this.clearCurrentGame();
    }

    const time = Date.now();
    const gameNavigationState = {
      game,
      sessionId: game.sessionId,
      timeGameLoaded: time,
      timeLastNavigated: time,
      post,
      gameParams,
      referrerGame,
    };

    let deferredNavigationState;
    if (this.state.navigation.contentMode === 'signin') {
      // never go 'back' to sign in
      deferredNavigationState = { mode: 'home', params: {} };
    } else if (this.state.navigation.contentMode === 'game') {
      // moving from one game to another; maintain existing 'back' state
      deferredNavigationState = this.state.navigation.deferredNavigationState;
    } else {
      // push new 'back' state
      deferredNavigationState = {
        params: { ...this.state.navigation, ...gameNavigationState },
        mode: this.state.navigation.contentMode,
      };
      // don't store game or session id in the deferred state, otherwise they could get out of date
      delete deferredNavigationState.params.game;
      delete deferredNavigationState.params.sessionId;
    }

    // track game launches
    Analytics.trackGameLaunch({ game, launchSource });
    // navigate to the game
    this._navigateToContentMode('game', {
      gameUrl: url,
      ...gameNavigationState,
      deferredNavigationState,
    });
  };

  // navigator actions
  _navigateToContentMode = (mode, navigationParams) => {
    if (mode !== 'game-meta') {
      // TODO: ben: decouple chat from game meta pages
      if (!navigationParams) navigationParams = {};
      navigationParams.gameMetaChannelId = null;
    }

    try {
      Analytics.trackNavigation({
        prevContentMode: this.state.navigation.contentMode,
        nextContentMode: mode,
      });
    } catch (e) {}

    if (!this.props.currentUser.user) {
      // NOTE(jim): All routes will be blocked unless a user is signed in.
      // can condition on AUTHENTICATED_ONLY_MODES if we want to only disallow certain routes.
      navigationParams = navigationParams || {};
      const originalParams = Object.assign({}, navigationParams);
      navigationParams = {
        deferredNavigationState: {
          mode,
          params: originalParams,
        },
      };
      mode = 'signin';
    }

    this.setState({
      navigation: {
        ...this.state.navigation,
        contentMode: mode,
        userProfileShown: null,
        timeLastNavigated: Date.now(),
        deferredNavigationState: null,
        ...navigationParams,
      },
    });
  };

  _addGameEventListeners = (game) => {
    window.addEventListener(
      'CASTLE_CONNECT_MULTIPLAYER_CLIENT_REQUEST',
      this._connectMultiplayerClientAsync
    );
  };

  _removeGameEventListeners = (game) => {
    window.removeEventListener(
      'CASTLE_CONNECT_MULTIPLAYER_CLIENT_REQUEST',
      this._connectMultiplayerClientAsync
    );
  };

  _connectMultiplayerClientAsync = async (e) => {
    let { game, sessionId } = this.state.navigation;
    let mediaUrl = e.params.mediaUrl;

    // join/create a multiplayer session
    let response;
    if (game && (game.gameId || game.url)) {
      response = await Actions.multiplayerJoinAsync(
        game ? game.gameId : null,
        game.hostedUrl || game.url,
        null,
        sessionId
      );
    } else {
      response = await Actions.multiplayerJoinAsync(null, null, mediaUrl, sessionId);
    }
    NativeUtil.sendLuaEvent('CASTLE_CONNECT_MULTIPLAYER_CLIENT_RESPONSE', {
      address: response.address,
    });

    if (response.sessionId && game) {
      // record the id of the multiplayer session we just joined/created
      this.setState({
        navigation: {
          ...this.state.navigation,
          sessionId: response.sessionId,
        },
      });
    }
  };

  setIsFullScreen = (isFullScreen) => {
    this.setState({
      navigation: {
        ...this.state.navigation,
        isFullScreen,
      },
    });
  };

  // assumes you have a channel id.
  // if not, use ChatContext.openChannel methods
  showChatChannel = async (channelId, options) => {
    let chatChannelId = channelId || this.state.chatChannelId;
    return this.setState({
      navigation: {
        ...this.state.navigation,
        chatChannelId: channelId,
        gameMetaChannelId:
          options && options.isGameMetaChannel
            ? channelId
            : this.state.navigation.gameMetaChannelId,
        isChatExpanded: true,
      },
    });
  };

  navigateToGameMeta = (channelId) => {
    let chatChannelId = channelId || this.state.navigation.chatChannelId;
    return this._navigateToContentMode('game-meta', {
      gameMetaChannelId: chatChannelId,
      chatChannelId: chatChannelId,
    });
  };

  toggleIsChatExpanded = () => {
    this.setState((state) => {
      return {
        ...state,
        navigation: {
          ...state.navigation,
          isChatExpanded: !state.navigation.isChatExpanded,
        },
      };
    });
  };

  navigateToHome = () => this._navigateToContentMode('home');

  navigateToContentMode = (mode) => this._navigateToContentMode(mode);

  navigateToSignIn = () => this._navigateToContentMode('signin');

  navigateToNotifications = () => this._navigateToContentMode('notifications');

  navigateToCreate = () => this._navigateToContentMode('create');

  navigateToEditPost = (params) => this._navigateToContentMode('edit_post', { params });

  navigateToCurrentGame = () => {
    if (!this.state.navigation.game) {
      throw new Error(`Cannot navigate to current game because there is no current game.`);
    }
    if (this.state.navigation.contentMode === 'edit_post') {
      this.state.navigation.params.onCancel();
    }
    let deferredNavigationState = {
      mode: this.state.navigation.contentMode,
      params: { ...this.state.navigation },
    };
    // don't store game or session id in the deferred state, otherwise they could get out of date
    delete deferredNavigationState.params.game;
    delete deferredNavigationState.params.sessionId;
    this._navigateToContentMode('game', { deferredNavigationState });
  };

  minimizeGame = () => {
    if (this.state.navigation.contentMode === 'game') {
      // refresh the user's status history so we the current game properly appears in the recently played list
      this.props.currentUser.refreshCurrentUser();
      this._restoreDeferredState();
    }
  };

  navigateToGameUrl = async (gameUrl, options) => {
    gameUrl = gameUrl.replace('castle://', 'http://');
    let game;
    try {
      game = await Browser.resolveGameAtUrlAsync(gameUrl, {
        upload: this.props.development.isMultiplayerCodeUploadEnabled,
      });
    } catch (e) {
      // forward this error to the user
      Logs.error(e.message);
    }

    if (game && game.url) {
      this._loadGameAsync(game, options);
    } else {
      Logs.error(`There was a problem opening the game at this url: ${gameUrl}`);
      this.navigateToHome();
    }
  };

  navigateToGame = (game, options) => {
    if (!game || Strings.isEmpty(game.url)) {
      return;
    }
    if (game.gameId) {
      // this is a known game object, not an abstract url request
      this._loadGameAsync(game, options);
    } else {
      // this is an incomplete game object, so try to resolve it before loading
      this.navigateToGameUrl(game.url, options);
    }
  };

  navigateToCurrentUserProfile = () => {
    if (this.props.currentUser.user) {
      this.navigateToUserProfile(this.props.currentUser.user);
      this.props.currentUser.refreshCurrentUser();
    } else {
      // show sign in
      this._navigateToContentMode('signin');
    }
  };

  navigateToUserProfile = async (user) => {
    let fullUser = this.props.userPresence.userIdToUser[user.userId];
    if (!fullUser) {
      try {
        fullUser = await Actions.getUser({ userId: user.userId });
        this.props.userPresence.addUser(fullUser);
      } catch (e) {
        // fall back to whatever we were given
        fullUser = user;
      }
    } else {
      // async refresh this user but don't block
      (async () => {
        try {
          const updatedUser = await Actions.getUser({ userId: user.userId });
          this.props.userPresence.addUser(updatedUser);
          this.setState((state) => {
            if (
              state.navigation.userProfileShown &&
              state.navigation.userProfileShown.userId == updatedUser.userId
            ) {
              // we're still viewing this profile, so add the refreshed profile data to
              // the navigation state.
              return {
                ...state,
                navigation: {
                  ...state.navigation,
                  userProfileShown: updatedUser,
                },
              };
            }
            return state;
          });
        } catch (_) {}
      })();
    }
    this._navigateToContentMode('profile', { userProfileShown: fullUser });
  };

  reloadGame = (onlyIfVisible) => {
    if (onlyIfVisible && this.state.navigation.contentMode !== 'game') {
      // not currently viewing the game and `onlyIfVisible` was set,
      // so ignore this
      return;
    }
    if (this._reloadDebounceTimeout) {
      clearTimeout(this._reloadDebounceTimeout);
    }
    this._reloadDebounceTimout = setTimeout(() => {
      this.navigateToGameUrl(this.state.navigation.game.url);
      this._reloadDebounceTimeout = null;
    }, 50);
  };

  clearCurrentGame = async () => {
    await GameWindow.close();
    this.setState((state, prevProps) => {
      const time = Date.now();
      const oldContentMode = state.navigation.contentMode;
      const newContentMode =
        oldContentMode === 'game' || oldContentMode === 'edit_post' ? 'home' : oldContentMode;
      // navigate away from the game
      Analytics.trackNavigation({
        prevContentMode: oldContentMode,
        nextContentMode: newContentMode,
      });
      // refresh the user's status history so we the current game properly appears in the recently played list
      prevProps.currentUser.refreshCurrentUser();
      // track the fact that a game was ended
      Analytics.trackGameEnd({ game: state.navigation.game });
      return {
        ...state,
        navigation: {
          ...state.navigation,
          contentMode: newContentMode,
          game: NavigationContextDefaults.game,
          sessionId: NavigationContextDefaults.sessionId,
          post: NavigationContextDefaults.post,
          gameParams: NavigationContextDefaults.gameParams,
          referrerGame: NavigationContextDefaults.referrerGame,
          gameUrl: NavigationContextDefaults.gameUrl,
          timeGameLoaded: time,
          timeLastNavigated: time,
        },
      };
    });
  };

  /**
   *  Generic url handler.
   *  If this is a url to a Castle game or a Castle post, opens the url inside Castle.
   *  Otherwise, routes the url to the machine's browser.
   *
   *  If options.allowCastleContentType == true, requests the url even if it doesn't
   *  look like a Castle url, and opens it as a game if it responds with a valid Castle
   *  content type. This is slower because we have to fetch the url again.
   */
  openUrl = async (url, options) => {
    const { isUrl, isCastleUrl, type, postId } = Urls.getCastleUrlInfo(url);
    let handled = false;
    if (isCastleUrl) {
      if (type === 'game') {
        handled = true;
        this.navigateToGameUrl(url, options);
      } else if (type === 'post') {
        handled = true;
        const post = await Actions.getPostById(postId);
        this._loadGameAsync(post.sourceGame, { post });
      }
    } else if (isUrl && options.allowCastleContentType) {
      const isCastleContentType = await Urls.doesUrlRespondWithCastleContentType(url);
      if (isCastleContentType) {
        handled = true;
        this.navigateToGameUrl(url, options);
      }
    }
    if (!handled) {
      // fall back to launching external browser
      NativeUtil.openExternalURL(url);
    }
  };

  _restoreDeferredState = () => {
    if (this.state.navigation.deferredNavigationState) {
      const { mode, params } = this.state.navigation.deferredNavigationState;
      if (mode === 'game' && params.gameUrl) {
        // re-resolve the game in case anything changed since they last tried to load it.
        this.navigateToGameUrl(params.gameUrl);
      } else {
        this._navigateToContentMode(mode, params);
      }
    } else {
      this.navigateToHome();
    }
  };

  render() {
    return (
      <NavigatorContext.Provider value={this.state.navigator}>
        <NavigationContext.Provider value={this.state.navigation}>
          {this.props.children}
        </NavigationContext.Provider>
      </NavigatorContext.Provider>
    );
  }
}

class NavigationContextProvider extends React.Component {
  render() {
    return (
      <UserPresenceContext.Consumer>
        {(userPresence) => (
          <CurrentUserContext.Consumer>
            {(currentUser) => (
              <DevelopmentContext.Consumer>
                {(development) => (
                  <NavigationContextManager
                    userPresence={userPresence}
                    currentUser={currentUser}
                    development={development}
                    {...this.props}
                  />
                )}
              </DevelopmentContext.Consumer>
            )}
          </CurrentUserContext.Consumer>
        )}
      </UserPresenceContext.Consumer>
    );
  }
}

export { NavigatorContext, NavigationContext, NavigationContextProvider };
