import * as React from 'react';
import { isKeyHotkey } from 'is-hotkey';

import * as Actions from '~/common/actions';
import AppContainer from '~/components/AppContainer';
import { CurrentUserContextProvider } from '~/contexts/CurrentUserContext';
import {
  DevelopmentSetterContext,
  DevelopmentContextProvider,
} from '~/contexts/DevelopmentContext';
import { SocialContextProvider } from '~/contexts/SocialContext';
import Logs from '~/common/logs';
import {
  NavigatorContext,
  NavigationContext,
  NavigationContextProvider,
} from '~/contexts/NavigationContext';
import * as NativeUtil from '~/native/nativeutil';
import { linkify } from 'react-linkify';
import * as Urls from '~/common/urls';
import * as PingUtils from '~/common/pingutils';
import * as LuaCalls from '~/common/luacalls';
import * as ScreenCapture from '~/common/screencapture';

const isReloadHotkey = isKeyHotkey('mod+r');
const isFullscreenHotkey = isKeyHotkey('mod+shift+f');
const isDevelopmentHotkey = isKeyHotkey('mod+j');
const isEscFullScreenHotkey = isKeyHotkey('esc');
const isEndGameHotkey = isKeyHotkey('mod+w');
const isScreenCaputureHotkey = isKeyHotkey('mod+x');

class App extends React.Component {
  _nativeChannelsPollTimeout;

  constructor(props) {
    super();
    this.state = props.state;
    this.state.updateAvailable = null;
  }

  componentDidMount() {
    window.addEventListener('nativeOpenUrl', this._handleNativeOpenUrlEvent);
    window.addEventListener('keydown', this._handleKeyDownEvent);
    window.addEventListener('CASTLE_SYSTEM_KEY_PRESSED', this._handleLuaSystemKeyDownEvent);
    window.addEventListener('nativeUpdateAvailable', this._handleNativeUpdateAvailableEvent);
    window.addEventListener('nativeMenuSelected', this._handleNativeMenuSelectedEvent);
    window.addEventListener('online', PingUtils.reportPingsAsync);
    window.addEventListener('GHOST_PRINT', this._handleLuaPrintEvent);
    window.addEventListener('GHOST_ERROR', this._handleLuaErrorEvent);
    window.addEventListener('nativeScreenCaptureReady', ScreenCapture.screenCaptureReadyEvent);
    LuaCalls.addEventListeners();
    PingUtils.reportPingsAsync();

    NativeUtil.setBrowserReady(() => {});

    linkify.add('castle:', 'http:').add('castles:', 'https:');
    window.onclick = (e) => {
      if (e.target.localName == 'a') {
        e.preventDefault();

        let url = e.target.href;
        if (Urls.isGameUrl(url)) {
          this.props.navigator.navigateToGameUrl(url);
        } else {
          NativeUtil.openExternalURL(url);
        }
      }
    };

    Logs.onFlushLogs(() => {
      const logs = Logs.consume();
      if (logs && logs.length) {
        this.props.development.addLogs(logs);
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener('nativeOpenUrl', this._handleNativeOpenUrlEvent);
    window.removeEventListener('keydown', this._handleKeyDownEvent);
    window.removeEventListener('CASTLE_SYSTEM_KEY_PRESSED', this._handleLuaSystemKeyDownEvent);
    window.removeEventListener('nativeMenuSelected', this._handleNativeMenuSelectedEvent);
    window.removeEventListener('online', PingUtils.reportPingsAsync);
    window.removeEventListener('GHOST_PRINT', this._handleLuaPrintEvent);
    window.removeEventListener('GHOST_ERROR', this._handleLuaErrorEvent);
    window.removeEventListener('nativeScreenCaptureReady', ScreenCapture.screenCaptureReadyEvent);
    LuaCalls.removeEventListeners();
    window.clearTimeout(this._nativeChannelsPollTimeout);
  }

  // event listeners
  _handleNativeOpenUrlEvent = (e) => {
    this.props.navigator.navigateToGameUrl(e.params.url);
  };

  _handleNativeMenuSelectedEvent = async (e) => {
    const { action } = e.params;
    if (action === 'file.open') {
      const openProjectPath = await NativeUtil.chooseOpenProjectPathWithDialogAsync();
      if (openProjectPath) {
        const gameUrl = `file://${openProjectPath}`;
        return this.props.navigator.navigateToGameUrl(gameUrl);
      }
    }
  };

  _handleLuaSystemKeyDownEvent = async (e) => {
    await Actions.delay(10);
    this._handleKeyDownEvent({ ...e.params, preventDefault() {} });
  };

  _handleNativeUpdateAvailableEvent = async ({ params }) => {
    window.removeEventListener('nativeUpdateAvailable', this._handleNativeUpdateAvailableEvent);
    this.setState({ updateAvailable: params });
  };

  _handleNativeUpdateInstall = async (shouldInstall) => {
    if (shouldInstall) {
      await NativeUtil.installUpdate();
    } else {
      await this.setState({ updateAvailable: null });
      await Actions.delay(3 * 3600 * 1000); // 3 hours
      window.addEventListener('nativeUpdateAvailable', this._handleNativeUpdateAvailableEvent);
    }
  };

  _handleFullScreenToggle = () => {
    this.props.navigator.setIsFullScreen(!this.props.navigation.isFullScreen);
  };

  _handleKeyDownEvent = (e) => {
    if (isReloadHotkey(e)) {
      e.preventDefault();
      return this.props.navigator.reloadGame(true);
    }

    if (isEscFullScreenHotkey(e)) {
      e.preventDefault();

      return this._handleFullScreenToggle();
    }

    if (isFullscreenHotkey(e)) {
      e.preventDefault();

      // NOTE(jim): I stubbed this out because you don't need to make the
      // lua experience full screen anymore when the UI can be toggled.
      /*
      (async () => {
        NativeUtil.setWindowFrameFullscreen(!(await NativeUtil.getWindowFrameFullscreen()));
      })();
      */

      return this._handleFullScreenToggle();
    }

    if (isDevelopmentHotkey(e)) {
      e.preventDefault();
      this.props.development.toggleIsDeveloping();
      return;
    }

    if (isEndGameHotkey(e)) {
      e.preventDefault();
      return this.props.navigator.clearCurrentGame();
    }

    if (isScreenCaputureHotkey(e)) {
      e.preventDefault();

      ScreenCapture.takeScreenCaptureAsync();
    }
  };

  _handleLuaPrintEvent = (e) => {
    const params = e.params;

    let logText;
    if (params && Array.isArray(params)) {
      logText = params.join(' ');
    } else {
      logText = '(nil)';
    }
    Logs.print(logText);
  };

  _handleLuaErrorEvent = (e) => {
    const { error, stacktrace } = e.params;
    Logs.error(error, stacktrace);
  };

  render() {
    return (
      <AppContainer
        featuredGames={this.state.featuredGames}
        featuredExamples={this.state.featuredExamples}
        allContent={this.state.allContent}
        updateAvailable={this.state.updateAvailable}
        isFullScreen={this.props.navigation.isFullScreen}
        onNativeUpdateInstall={this._handleNativeUpdateInstall}
      />
    );
  }
}

class AppWithContext extends React.Component {
  render() {
    return (
      <DevelopmentSetterContext.Consumer>
        {(development) => (
          <NavigationContext.Consumer>
            {(navigation) => (
              <NavigatorContext.Consumer>
                {(navigator) => (
                  <App
                    {...this.props}
                    development={development}
                    navigator={navigator}
                    navigation={navigation}
                  />
                )}
              </NavigatorContext.Consumer>
            )}
          </NavigationContext.Consumer>
        )}
      </DevelopmentSetterContext.Consumer>
    );
  }
}

export default class AppWithProvider extends React.Component {
  render() {
    let { currentUser, navigation } = this.props.state;
    return (
      <CurrentUserContextProvider value={currentUser}>
        <SocialContextProvider>
          <DevelopmentContextProvider>
            <NavigationContextProvider value={{ navigation }}>
              <AppWithContext {...this.props} />
            </NavigationContextProvider>
          </DevelopmentContextProvider>
        </SocialContextProvider>
      </CurrentUserContextProvider>
    );
  }
}
