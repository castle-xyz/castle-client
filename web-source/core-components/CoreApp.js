import * as React from 'react';

import * as Browser from '~/common/browser';
import * as Strings from '~/common/strings';
import * as Utilities from '~/common/utilities';
import * as ReactDOM from 'react-dom';
import * as Slack from '~/common/slack';
import * as Actions from '~/common/actions';
import * as Network from '~/common/network';
import * as CEF from '~/common/cef';
import * as Urls from '~/common/urls';
import History from '~/common/history';
import Logs from '~/common/logs';
import UserPlay from '~/common/userplay';
import Share from '~/common/share';

import { css } from 'react-emotion';
import { isKeyHotkey } from 'is-hotkey';
import { LOADER_STRING } from '~/core-components/primitives/loader';

import CoreLayout from '~/core-components/layouts/CoreLayout';
import CoreRootHeader from '~/core-components/CoreRootHeader';
import CoreRootURLInput from '~/core-components/CoreRootURLInput';
import CoreRootLeftSidebar from '~/core-components/CoreRootLeftSidebar';
import CoreRootToolbar from '~/core-components/CoreRootToolbar';
import CoreRootContextSidebar from '~/core-components/CoreRootContextSidebar';
import CoreRootDashboard from '~/core-components/CoreRootDashboard';
import CoreLoginSignup from '~/core-components/CoreLoginSignup';
import CoreBrowserScreen from '~/core-components/CoreBrowserScreen';
import CoreBrowseResults from '~/core-components/CoreBrowseResults';
import CoreBrowseSearchInput from '~/core-components/CoreBrowseSearchInput';
import CoreProfile from '~/core-components/CoreProfile';
import CoreDevelopmentLogs from '~/core-components/CoreDevelopmentLogs';

const isOverlayHotkey = isKeyHotkey('mod+e');
const isDevelopmentLogHotkey = isKeyHotkey('mod+j');
const isOrientationHotkey = isKeyHotkey('mod+shift+o');
const isReloadHotkey = isKeyHotkey('mod+r');
const isAppReloadHotkey = isKeyHotkey('mod+shift+r');

const POLL_DELAY = 300;
const ENABLE_HIDE_OVERLAY = true;

export default class CoreApp extends React.Component {
  _layout;
  _devTimeout;
  _contextSidebar;
  _isLockedFromCEFUpdates = true;

  constructor(props) {
    super();

    this.state = props.state;
    this._history = new History(props.storage);
  }

  async componentDidMount() {
    window.addEventListener('nativeOpenUrl', this._handleNativeOpenUrl);
    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('nativeLoadEnd', this._handleNativeLoadEnd);
    window.addEventListener('nativeLoadError', this._handleNativeLoadError);
    Share.addEventListeners();

    const processChannels = async () => {
      await CEF.readLogChannelsAsync();
      const logs = Logs.consume();

      if (logs && logs.length) {
        this.setState({ logs: [...this.state.logs, ...logs] });
      }
      this._devTimeout = window.setTimeout(processChannels, POLL_DELAY);
    };

    CEF.setBrowserReady(() => {
      this.updateFrame();
      processChannels();
    });

  }

  componentWillUnmount() {
    window.removeEventListener('nativeOpenUrl', this._handleNativeOpenUrl);
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('nativeLoadEnd', this._handleNativeLoadEnd);
    window.removeEventListener('nativeLoadError', this._handleNativeLoadError);
    Share.removeEventListeners();
    window.clearTimeout(this._devTimeout);
  }

  closeCEF = () => {
    UserPlay.stopAsync();

    if (this._isLockedFromCEFUpdates) {
      console.log('closeCEF: already locked');
      return;
    }

    this._isLockedFromCEFUpdates = true;
    CEF.closeWindowFrame();
  };

  openCEF = async (url, userPlayData) => {
    if (!this._isLockedFromCEFUpdates) {
      console.log('openCEF: is not closed');
      return;
    }

    this._isLockedFromCEFUpdates = false;

    // Don't `await` this since we don't want to make it take longer to get the media
    UserPlay.startAsync(userPlayData);

    let isLoggedIn = !!(await Actions.getViewer());

    await CEF.openWindowFrame(url);

    // Sync state for new Ghost instance
    CEF.sendLuaEvent('CASTLE_SET_LOGGED_IN', isLoggedIn);
    CEF.sendLuaEvent('CASTLE_SET_VOLUME', this.state.isMuted ? 0 : 1);
  };

  updateFrame = () => {
    if (this._isLockedFromCEFUpdates) {
      return;
    }

    const element = this._layout.getMediaContainerRef();
    const rect = element.getBoundingClientRect();
    CEF.updateWindowFrame(rect);
    CEF.setWindowFrameVisible(true);
  };

  hideFrame = () => {
    CEF.setWindowFrameVisible(false);
  };

  refreshViewer = async () => {
    const viewer = await Actions.getViewer();

    if (!viewer) {
      return;
    }

    const updates = { viewer };
    if (this.state.viewer && this.state.creator && viewer.userId === this.state.creator.userId) {
      updates.creator = viewer;
    }

    this.setState(updates);
  };

  _handleClearLogs = () => {
    this.setState({ logs: [] });
  };

  _handleLoadTutorial = () => {
    CEF.openExternalURL('http://www.playcastle.io/get-started');
  };

  // could implement these hooks to listen for CEF callbacks after loading
  // or failing to load web pages.
  _handleNativeLoadEnd = () => {};
  _handleNativeLoadError = () => {};

  _handleClearHistory = () => {
    this._history.clear();
  };

  _handleProfileChange = () => this.refreshViewer();

  setStateWithCEF = (state) => {
    if (this._isLockedFromCEFUpdates) {
      return this.setState({ ...state });
    }

    this.setState({ ...state }, this.updateFrame);
  };

  setStateHideCEF = (state) => {
    if (this._isLockedFromCEFUpdates) {
      return this.setState({ ...state });
    }

    this.setState({ ...state }, this.hideFrame);
  };

  appReload = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!this.state.pageMode && !Strings.isEmpty(this.state.mediaUrl)) {
      this.hideFrame();
    }

    const loader = document.createElement('div');
    loader.innerHTML = LOADER_STRING.trim();
    loader.id = 'loader';

    document.body.appendChild(loader);

    const { featuredMedia, allContent, viewer, isOffline } = await Network.getProductData();

    const state = {
      featuredMedia,
      viewer,
      allContent,
      searchResults: {
        ...this.state.allContent,
      },
      isOffline,
    };

    document.getElementById('loader').classList.add('loader--finished');
    await Actions.delay(300);

    this.setState({ ...state }, () => {
      document.getElementById('loader').outerHTML = '';
      if (!Strings.isEmpty(this.state.mediaUrl)) {
        this.reload();
      }
    });
  };

  reload = async (e) => {
    if (e) {
      e.preventDefault();
    }
    await Actions.delay(100);
    this.requestMediaAtUrlAsync(this.state.mediaUrl);
  };

  _handleLogin = (viewer) =>
    this.setState({ viewer, creator: viewer, pageMode: viewer ? 'profile' : 'browse' });

  _onUrlInputChange = (e) => this.setState({ urlBarInputValue: e.target.value });

  requestMediaAtUrlAsync = async (mediaUrl) => {
    let media;
    try {
      media = await Browser.resolveMediaAtUrlAsync(mediaUrl);
    } catch (e) {
      // forward this error to the user
      Logs.error(e.message);
    }

    if (media && media.mediaUrl) {
      this.loadMediaAsync(media);
    } else {
      // something went wrong, just show the error
      this.setStateWithCEF({
        sidebarMode: 'development',
        pageMode: null,
        creator: null,
        browserUrl: null,
      });
    }
  };

  loadMediaAsync = async (media) => {
    let { mediaUrl, entryPoint } = media;
    if (!entryPoint) {
      // TODO: metadata: this should always be defined by this point
      entryPoint = mediaUrl;
    }
    if (Strings.isEmpty(mediaUrl)) {
      return;
    }

    this.closeCEF();

    const userPlayData = { mediaUrl, ...media };
    this.openCEF(entryPoint, userPlayData);
    this._history.addItem(media ? media : { mediaUrl });
    Logs.system(`Loading project at ${mediaUrl}`);

    amplitude.getInstance().logEvent('OPEN_LUA', {
      mediaUrl,
    });

    const isLocal = Urls.isPrivateUrl(mediaUrl);
    const sidebarMode = isLocal ? 'development' : 'current-context';
    this.setStateWithCEF({
      media,
      mediaUrl,
      urlBarInputValue: mediaUrl,
      sidebarMode,
      pageMode: null,
      creator: null,
      browserUrl: null,
    });
  };

  _handleNativeOpenUrl = (e) => {
    this.setState({ urlBarInputValue: e.params.url }, this._onUrlInputSubmit);
  };

  _onUrlInputSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    let mediaUrl;
    try {
      mediaUrl = this.state.urlBarInputValue.slice(0).trim();
      if (Urls.isPrivateUrl(mediaUrl)) {
        mediaUrl = mediaUrl.replace('castle://', 'http://');
      }
    } catch (_) {}
    if (Strings.isEmpty(mediaUrl)) {
      return;
    }

    this.setState(
      {
        mediaUrl,
        urlBarInputValue: mediaUrl,
      },
      async () => {
        this.requestMediaAtUrlAsync(this.state.mediaUrl);
      }
    );
  };

  _handleCreateProjectAsync = async () => {
    const newProjectDirectory = await CEF.chooseDirectoryWithDialogAsync({
      title: 'Create a New Castle Project',
      message: 'Choose a folder where the project will be created.',
      action: 'Create Project',
    });
    if (newProjectDirectory) {
      let entryPointFilePath;
      try {
        entryPointFilePath = await CEF.createProjectAtPathAsync(newProjectDirectory);
      } catch (_) {}
      if (entryPointFilePath) {
        const mediaUrl = `file://${entryPointFilePath}`;
        await this.requestMediaAtUrlAsync(mediaUrl);
        Logs.system('Welcome to Castle!');
        Logs.system(`We created some starter code for your project at ${this.state.media.entryPoint}.`);
        Logs.system(`Open that file in your favorite text editor to get started.`);
        Logs.system(`Need help? Check out http://www.playcastle.io/get-started`);
        // regardless of previous sidebar state, force sidebar visible and
        // logs visible within sidebar.
        this._handleShowDevelopmentLogs();
      }
    }
  };

  _handleKeyDown = (e) => {
    if (isReloadHotkey(e)) {
      return this.reload(e);
    }

    if (isAppReloadHotkey(e)) {
      return this.appReload(e);
    }

    if (isOrientationHotkey(e)) {
      return this._handleOrientationChange(e);
    }

    if (isOverlayHotkey(e) && ENABLE_HIDE_OVERLAY) {
      return this._handleToggleOverlay(e);
    }

    if (isDevelopmentLogHotkey(e)) {
      if (this.state.sidebarVisible === false) {
        // if nothing is showing, force devlogs to show
        return this._handleShowDevelopmentLogs(e);
      } else {
        // otherwise, switch between sidebar modes
        return this._handleToggleSidebarMode(e);
      }
    }
  };

  _stringAsSearchInvariant = (s) => {
    return s.toLowerCase().trim();
  };

  _stringIncludesSearchQuery = (s, query) => {
    if (Strings.isEmpty(s)) {
      return false;
    }

    return this._stringAsSearchInvariant(s).includes(query);
  };

  _filterMediaItemWithSearchState = (m) => {
    if (!m) {
      return false;
    }
    const query = this._stringAsSearchInvariant(this.state.searchQuery);
    if (this._stringIncludesSearchQuery(m.name, query)) {
      return true;
    }

    if (Strings.isEmpty(m.name) && this._stringIncludesSearchQuery(m.mediaUrl, query)) {
      return true;
    }

    if (m.user) {
      if (this._stringIncludesSearchQuery(m.user.name, query)) {
        return true;
      }
      if (this._stringIncludesSearchQuery(m.user.username, query)) {
        return true;
      }
    }

    return false;
  };

  _filterUserWithSearchState = (u) => {
    if (!u) {
      return false;
    }
    const query = this._stringAsSearchInvariant(this.state.searchQuery);
    if (this._stringIncludesSearchQuery(u.name, query)) {
      return true;
    }
    if (this._stringIncludesSearchQuery(u.username, query)) {
      return true;
    }
    return false;
  };

  _handleNavigateToBrowserPage = (browserUrl) => {
    if (window.cefQuery) {
      CEF.openExternalURL(browserUrl);

      return;
    }

    this.setState({ browserUrl, pageMode: null });
  };

  _handleDismissBrowserPage = () => this.setState({ browserUrl: null });

  _handleSearchSubmit = async (e) => this._handleSearchChange(e);

  _handleSearchReset = () => {
    this.setState({
      searchQuery: '',
      searchResults: {
        ...this.state.allContent,
      },
      pageMode: 'browse',
    });
  };

  _handleSearchChange = async (e) => {
    this.setState(
      {
        pageMode: 'browse',
        searchQuery: e.target.value,
      },
      () => {
        if (Strings.isEmpty(this.state.searchQuery)) {
          return this._handleSearchReset();
        }

        this.setState({
          searchResults: {
            media: this.state.allContent.media.filter(this._filterMediaItemWithSearchState),
            users: this.state.allContent.users.filter(this._filterUserWithSearchState),
          },
        });
      }
    );
  };

  _handleUserSelect = async (user) => {
    if (!user) {
      return;
    }

    const creator = await Actions.getUser(user);

    if (!creator) {
      return;
    }

    if (this.state.pageMode === 'profile') {
      this.setState({ pageMode: 'profile', creator: { ...creator } });
      return;
    }

    this.setStateHideCEF({
      pageMode: 'profile',
      creator: { ...creator },
    });
  };

  _handleMediaSelect = (media, isHistory) => {
    if (!media) {
      return;
    }

    if (Strings.isEmpty(media.mediaUrl)) {
      console.error('handleMediaSelect: no media url provided on entity');
      return;
    }

    if (isHistory) {
      this.setState({
        searchQuery: '',
        searchResults: {
          ...this.state.allContent,
        },
      });
    }

    if (media.mediaId) {
      // this is a known media object, not an abstract url request
      this.loadMediaAsync(media);
    } else {
      // this is an incomplete media object, so try to resolve it before loading
      this.requestMediaAtUrlAsync(media.mediaUrl);
    }
  };

  _handleOrientationChange = () => {
    this.setStateWithCEF({
      isHorizontalOrientation: this.state.isHorizontalOrientation ? false : true,
    });
  };

  _handleToggleProfile = () => {
    // optimistically show profile right away
    // but also async refresh profile data
    this.setStateHideCEF({
      pageMode: 'profile',
      creator: { ...this.state.viewer },
    });
    this.refreshViewer();
  };

  _handleTogglePlay = () => {
    const updates = {
      pageMode: null,
      creator: null,
    };

    this.setStateWithCEF({
      ...updates,
    });
  };

  _handleToggleBrowse = () => {
    const isOwner =
      this.state.viewer &&
      this.state.creator &&
      this.state.viewer.userId === this.state.creator.userId;

    if (this.state.pageMode === 'profile' && this.state.creator && !isOwner) {
      return;
    }

    this.setStateHideCEF({
      pageMode: 'browse',
      creator: null,
    });
  };

  _handleToggleSignIn = () => {
    this.setStateHideCEF({
      pageMode: 'sign-in',
      creator: null,
    });
  };

  _handleToggleHistory = () => {
    this.setStateHideCEF({
      pageMode: 'history',
      creator: null,
    });
  };

  _handleToggleSidebar = () => {
    this.setStateWithCEF({
      sidebarVisible: !this.state.sidebarVisible,
    });
  };

  _handleShowDevelopmentLogs = () => {
    const updates = {
      sidebarVisible: true,
      sidebarMode: 'development',
    };

    this.setStateWithCEF({
      pageMode: null,
      creator: null,
      ...updates,
    });
  };

  _handleToggleSidebarMode = () => {
    const updates = {
      sidebarVisible: true,
      sidebarMode: this.state.sidebarMode === 'development' ? 'current-context' : 'development',
    };

    // only poll for remote logs if the user is viewing the logs
    if (updates.sidebarMode === 'development') {
      Logs.startPollingForRemoteLogs(this.state.mediaUrl);
    } else {
      Logs.stopPollingForRemoteLogs();
    }

    this.setStateWithCEF({
      pageMode: null,
      creator: null,
      ...updates,
    });
  };

  _handleSignOut = () => {
    if (!Actions.logout()) {
      return;
    }

    this.setStateHideCEF({
      viewer: null,
      creator: null,
      pageMode: 'sign-in',
    });
  };

  _handleHideOverlay = () => {
    const updates = {
      isOverlayActive: false,
      pageMode: null,
    };

    this.setStateWithCEF({ ...updates });
  };

  _handleToggleMute = async () => {
    const isMuted = !this.state.isMuted;
    CEF.sendLuaEvent('CASTLE_SET_VOLUME', isMuted ? 0 : 1);
    this.setStateWithCEF({ isMuted });
    return;
  };

  _handleToggleOverlay = () => {
    const updates = {
      isOverlayActive: !this.state.isOverlayActive,
      pageMode: null,
    };

    this.setStateWithCEF({
      ...updates,
    });
  };

  _handleGetReference = (reference) => {
    this._layout = reference;
  };

  renderRootURLInput = () => (
    <CoreRootURLInput
      name="urlBarInputValue"
      placeholder="Type in the URL to a Castle game..."
      value={this.state.urlBarInputValue}
      viewer={this.state.viewer}
      isMuted={this.state.isMuted}
      onChange={this._onUrlInputChange}
      onSubmit={this._onUrlInputSubmit}
      onHideOverlay={this._handleHideOverlay}
      onToggleMute={this._handleToggleMute}
    />
  );

  renderRootSearchInput = () => (
    <CoreBrowseSearchInput
      searchQuery={this.state.searchQuery}
      onSearchReset={this._handleSearchReset}
      onChange={this._handleSearchChange}
      onSubmit={this._handleSearchSubmit}
    />
  );

  render() {
    const { state } = this;

    const isViewerViewingBrowseScene = state.pageMode === 'browse';
    const isViewerViewingSignInScene = state.pageMode === 'sign-in';
    const isViewerViewingProfileScene = state.pageMode === 'profile';
    const isViewerViewingHistoryScene = state.pageMode === 'history';
    const isViewerPlayingMedia = !state.pageMode;

    const isViewingOwnProfile =
      isViewerViewingProfileScene &&
      state.viewer &&
      state.creator &&
      state.viewer.userId === state.creator.userId;

    const isRenderingBrowser = !Strings.isEmpty(state.browserUrl);

    let maybeBrowserNode;
    if (isRenderingBrowser) {
      maybeBrowserNode = (
        <CoreBrowserScreen
          key="core-browser-screen"
          isVisible={!state.pageMode}
          onDismiss={this._handleDismissBrowserPage}
          browserUrl={state.browserUrl}
        />
      );
    }

    let maybeLeftSidebarNode;
    if (state.isOverlayActive && !state.isOffline) {
      maybeLeftSidebarNode = (
        <CoreRootLeftSidebar
          viewer={state.viewer}
          isPlaying={isViewerPlayingMedia}
          isBrowsing={
            isViewerViewingBrowseScene ||
            (isViewerViewingProfileScene && !isViewingOwnProfile)
          }
          isSignIn={isViewerViewingSignInScene}
          isViewingProfile={isViewingOwnProfile}
          isViewingHistory={isViewerViewingHistoryScene}
          onToggleProfile={this._handleToggleProfile}
          onToggleBrowse={this._handleToggleBrowse}
          onToggleSignIn={this._handleToggleSignIn}
          onTogglePlay={this._handleTogglePlay}
          onToggleHistory={this._handleToggleHistory}
        />
      );
    }

    if (isViewerViewingBrowseScene) {
      return (
        <CoreLayout
          ref={this._handleGetReference}
          topNode={this.renderRootSearchInput()}
          leftSidebarNode={maybeLeftSidebarNode}>
          <CoreBrowseResults
            results={state.searchResults}
            featuredMedia={state.featuredMedia}
            isPristine={Strings.isEmpty(state.searchQuery)}
            searchQuery={state.searchQuery}
            onUserSelect={this._handleUserSelect}
            onMediaSelect={this._handleMediaSelect}
            onCreateProject={this._handleCreateProjectAsync}
            onLoadHelp={this._handleLoadTutorial}
            onLoadURL={this.requestMediaAtUrlAsync}
          />
        </CoreLayout>
      );
    }

    if (isViewerViewingSignInScene) {
      return (
        <CoreLayout ref={this._handleGetReference} leftSidebarNode={maybeLeftSidebarNode}>
          <CoreLoginSignup onLogin={this._handleLogin} />
        </CoreLayout>
      );
    }

    if (isViewerViewingHistoryScene) {
      return (
        <CoreLayout ref={this._handleGetReference} leftSidebarNode={maybeLeftSidebarNode}>
          <CoreRootDashboard
            media={state.media}
            history={this._history}
            onMediaSelect={this._handleMediaSelect}
            onUserSelect={this._handleUserSelect}
            onClearHistory={this._handleClearHistory}
            onToggleBrowse={this._handleToggleBrowse}
          />
        </CoreLayout>
      );
    }

    if (isViewerViewingProfileScene) {
      return (
        <CoreLayout ref={this._handleGetReference} leftSidebarNode={maybeLeftSidebarNode}>
          <CoreProfile
            viewer={state.viewer}
            creator={state.creator}
            onSearchReset={this._handleSearchReset}
            onMediaSelect={this._handleMediaSelect}
            onAfterSave={this._handleProfileChange}
            onUserSelect={this._handleUserSelect}
            onSignOut={this._handleSignOut}
          />
        </CoreLayout>
      );
    }

    let maybeBottomNode;
    if (state.isOverlayActive) {
      maybeBottomNode = this.renderRootURLInput();
    }

    let maybeTopNode;
    if (state.isOverlayActive) {
      maybeTopNode = (
        <CoreRootHeader
          viewer={state.viewer}
          media={state.media}
          isContextSidebarActive={!!state.sidebarVisible}
          isOffline={state.isOffline}
          onToggleSidebar={this._handleToggleSidebar}
        />
      );
    }

    let maybeRightNode;
    if (state.isOverlayActive && state.sidebarVisible === true) {
      if (state.sidebarMode === 'current-context') {
        maybeRightNode = (
          <CoreRootContextSidebar
            ref={(c) => {
              this._contextSidebar = c;
            }}
            media={state.media}
            viewer={state.viewer}
            storage={this.props.storage}
            searchQuery={state.searchQuery}
            onNavigateToBrowserPage={this._handleNavigateToBrowserPage}
            onRefreshViewer={this.refreshViewer}
            onToggleBrowse={this._handleToggleBrowse}
            onToggleProfile={this._handleToggleProfile}
            onMediaSelect={this._handleMediaSelect}
            onUserSelect={this._handleUserSelect}
          />
        );
      } else if (state.sidebarMode === 'development') {
        maybeRightNode = (
          <CoreDevelopmentLogs
            logs={state.logs}
            onLoadHelp={this._handleLoadTutorial}
            onClearLogs={this._handleClearLogs}
          />
        );
      }
    }

    return (
      <CoreLayout
        ref={this._handleGetReference}
        topNode={maybeTopNode}
        bottomNode={maybeBottomNode}
        leftSidebarNode={maybeLeftSidebarNode}
        isHorizontalOrientation={state.isHorizontalOrientation}
        rightNode={maybeRightNode}>
        {maybeBrowserNode}
      </CoreLayout>
    );
  }
}
