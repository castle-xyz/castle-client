import * as React from 'react';
import * as Actions from '~/common/actions';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import * as PingUtils from '~/common/pingutils';
import * as Bridge from '~/common/bridge';
import * as ScreenCapture from '~/common/screencapture';
import * as ExecNode from '~/common/execnode';
import * as VoiceChat from '~/common/voicechat';

import { isKeyHotkey } from 'is-hotkey';
import { linkify } from 'react-linkify';
import { CurrentUserContext, CurrentUserContextProvider } from '~/contexts/CurrentUserContext';
import {
  DevelopmentSetterContext,
  DevelopmentContextProvider,
} from '~/contexts/DevelopmentContext';
import {
  NavigatorContext,
  NavigationContext,
  NavigationContextProvider,
} from '~/contexts/NavigationContext';
import { ChatContextProvider } from '~/contexts/ChatContext';
import { UserPresenceContextProvider } from '~/contexts/UserPresenceContext';

import AppContainer from '~/components/AppContainer';
import ChatInput from '~/components/chat/ChatInput';
import Logs from '~/common/logs';
import PublishHistory from '~/common/publish-history';

const isReloadHotkey = isKeyHotkey('mod+r');
const isFullscreenHotkey = isKeyHotkey('mod+shift+f');
const isDevelopmentHotkey = isKeyHotkey('mod+j');
const isEscFullScreenHotkey = isKeyHotkey('esc');
const isEndGameHotkey = isKeyHotkey('mod+w');
// TODO: this breaks 'cut' on macOS const isScreenCaputureHotkey = isKeyHotkey('mod+x');
const isFocusGameHotkey = isKeyHotkey('mod+g');

// TODO(jim): Feature flag to make it easier to test.
const USE_GAME_SCREEN_DEBUG = false;

class App extends React.Component {
  _nativeChannelsPollTimeout;

  constructor(props) {
    super();
    this.state = props.state;
    this.state.updateAvailable = null;
    PublishHistory.setStorage(props.storage);
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
    window.addEventListener('nativeExecNodeComplete', ExecNode.execNodeCompleteEvent);
    window.addEventListener('click', this._handleAnchorClick);
    window.addEventListener('nativeFocusChat', this._handleNativeFocusChat);
    Bridge.addEventListeners();
    PingUtils.reportPingsAsync();
    NativeUtil.setBrowserReady(() => {
      // to simulate booting with a deep link.
      // the "isTrusted" flag is sent by windows somewhere.
      /* this._handleNativeOpenUrlEvent(
        {"isTrusted":false,"params":{"url":"castle://castle.games/+29/@liquidream/the-ballz-are-lava"}}
      ); */
    });

    linkify.add('castle:', 'http:').add('castles:', 'https:');

    Logs.onFlushLogs(() => {
      const logs = Logs.consume();
      if (logs && logs.length) {
        this.props.development.addLogs(logs);
      }
    });

    VoiceChat.startVoiceChatAsync();
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
    window.removeEventListener('nativeExecNodeComplete', ExecNode.execNodeCompleteEvent);
    window.removeEventListener('click', this._handleAnchorClick);
    Bridge.removeEventListeners();
    window.clearTimeout(this._nativeChannelsPollTimeout);
  }

  _handleAnchorClick = (e) => {
    if (e.target.localName == 'a') {
      e.preventDefault();

      if (e.target.href === 'noop:noop;') {
        // To allow no-op `a` tags
        return;
      }

      this.props.navigator.openUrl(e.target.href, { launchSource: 'link' });
    }
  };

  _handleNativeOpenUrlEvent = (e) => {
    let url = e.params.url;
    if (url && url.indexOf('://') === -1) {
      url = `file://${url}`;
    }
    this.props.navigator.openUrl(url, { launchSource: 'external-link' });
  };

  _handleNativeMenuSelectedEvent = async (e) => {
    const { action } = e.params;
    if (action === 'file.open') {
      const openProjectPath = await NativeUtil.chooseOpenProjectPathWithDialogAsync();
      if (openProjectPath) {
        const gameUrl = `file://${openProjectPath}`;
        return this.props.navigator.navigateToGameUrl(gameUrl, { launchSource: 'native-menu' });
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

    /* TODO: reenable screen capture if (isScreenCaputureHotkey(e)) {
      e.preventDefault();

      ScreenCapture.takeScreenCaptureAsync();
    } */

    if (isFocusGameHotkey(e)) {
      NativeUtil.focusGame();
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

  _handleNativeFocusChat = async () => {
    await Actions.delay(80);
    ChatInput.focus();
  };

  render() {
    return (
      <AppContainer
        trendingGames={this.state.trendingGames}
        featuredExamples={this.state.featuredExamples}
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
        <UserPresenceContextProvider>
          <DevelopmentContextProvider>
            <NavigationContextProvider value={{ navigation }}>
              <ChatContextProvider>
                <AppWithContext {...this.props} />
              </ChatContextProvider>
            </NavigationContextProvider>
          </DevelopmentContextProvider>
        </UserPresenceContextProvider>
      </CurrentUserContextProvider>
    );
  }
}
