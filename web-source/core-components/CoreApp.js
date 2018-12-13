import * as React from 'react';
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
import CoreLoadingScreen from '~/core-components/CoreLoadingScreen';
import CoreRootHeader from '~/core-components/CoreRootHeader';
import CoreRootURLInput from '~/core-components/CoreRootURLInput';
import CoreRootLeftSidebar from '~/core-components/CoreRootLeftSidebar';
import CoreRootToolbar from '~/core-components/CoreRootToolbar';
import CoreRootContextSidebar from '~/core-components/CoreRootContextSidebar';
import CoreRootDashboard from '~/core-components/CoreRootDashboard';
import CoreLoginSignup from '~/core-components/CoreLoginSignup';
import CoreMediaScreen from '~/core-components/CoreMediaScreen';
import CoreBrowserScreen from '~/core-components/CoreBrowserScreen';
import CoreBrowseResults from '~/core-components/CoreBrowseResults';
import CoreBrowseSearchInput from '~/core-components/CoreBrowseSearchInput';
import CoreProfile from '~/core-components/CoreProfile';
import CorePlaylist from '~/core-components/CorePlaylist';
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
    if (this._isLockedFromCEFUpdates) {
      console.log('closeCEF: already locked');
      return;
    }

    this._isLockedFromCEFUpdates = true;

    UserPlay.stopAsync();
    CEF.closeWindowFrame();
  };

  openCEF = (url, userPlayData) => {
    if (!this._isLockedFromCEFUpdates) {
      console.log('openCEF: is not closed');
      return;
    }

    this._isLockedFromCEFUpdates = false;

    // Don't `await` this since we don't want to make it take longer to get the media
    UserPlay.startAsync(userPlayData);

    CEF.openWindowFrame(url);
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

  // TODO(jim):
  // Someone needs to implement the ability to pause/freeze a LUA game
  // and make it invisible on screen.
  hideFrame = () => {
    // TODO(jim): Hide Frame doesn't actually close the CEF. but makes it invisible instead.
    // this.closeCEF();
    CEF.setWindowFrameVisible(false);

    if (this._isLockedFromCEFUpdates) {
      return;
    }

    // TODO(jim): when we are ready to, we can replace this with actual hide code.
    // const element = this._layout.getMediaContainerRef();
    // const rect = element.getBoundingClientRect();
    // CEF.updateWindowFrame(rect);
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

  _handleNativeLoadEnd = async () => {
    await Actions.delay(2000);

    this.setState({ mediaLoading: false });
  };

  _handleNativeLoadError = () => {
    this.setState({ mediaLoading: false });
  };

  _handleClearHistory = () => {
    this._history.clear();
  };

  _handleProfileChange = () => this.refreshViewer();

  _handleRemoveMediaFromPlaylist = async data => {
    const response = await Actions.removeMediaFromPlaylist(data);
    if (!response) {
      return;
    }

    const playlist = await Actions.getPlaylist(data);
    if (!playlist) {
      return;
    }

    this.setState({ playlist });
    await this.refreshViewer();
  };

  setStateWithCEF = state => {
    if (this._isLockedFromCEFUpdates) {
      return this.setState({ ...state });
    }

    this.setState({ ...state }, this.updateFrame);
  };

  setStateHideCEF = state => {
    if (this._isLockedFromCEFUpdates) {
      return this.setState({ ...state });
    }

    this.setState({ ...state }, this.hideFrame);
  };

  appReload = async e => {
    if (e) {
      e.preventDefault();
    }

    const isShowingLUAGame =
      !this.state.pageMode &&
      !Strings.isEmpty(this.state.mediaUrl) &&
      Urls.isLua(this.state.mediaUrl);

    if (isShowingLUAGame) {
      // TODO(jim):
      // Someone needs to implement the ability to pause/freeze a LUA game
      // and make it invisible on screen.
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
      if (isShowingLUAGame) {
        this.reload();
      }
    });
  };

  reload = async e => {
    if (e) {
      e.preventDefault();
    }

    const mediaUrl = this.state.mediaUrl.slice(0);
    if (Strings.isEmpty(mediaUrl)) {
      return;
    }

    this.setState({ mediaUrl }, async () => {
      await Actions.delay(100);

      this.loadURL(mediaUrl);
    });
  };

  _handleLogin = viewer =>
    this.setState({ viewer, creator: viewer, pageMode: viewer ? 'profile' : 'browse' });

  _handleURLChange = e => this.setState({ [e.target.name]: e.target.value });

  loadURL = mediaUrl => this._loadMedia({ mediaUrl });

  _loadMedia = media => {
    if (Urls.isLua(media.mediaUrl)) {
      this.goToLUA(media.mediaUrl);
      return;
    }

    this.goToHTML5Media({ ...media });
  };

  _handleURLSubmit = () => {
    if (Strings.isEmpty(this.state.mediaUrl)) {
      alert('You must provide a URL');
      return;
    }

    this.loadURL(this.state.mediaUrl);
  };

  goToHTML5Media = async media => {
    this.closeCEF();

    // HACK(jim): This is a great way to disable this feature for local web.
    if (this.state.mediaUrl !== media.mediaUrl && window.cefQuery) {
      this.setState({ mediaLoading: true });
    }

    amplitude.getInstance().logEvent('OPEN_HTML5', {
      mediaUrl: media.mediaUrl,
    });

    const existingMedia = await Actions.getMediaByURL({
      mediaUrl: media.mediaUrl,
    });

    this._history.addItem(existingMedia ? existingMedia : media);

    this.setStateWithCEF({
      media: existingMedia ? { ...existingMedia } : { ...media },
      mediaUrl: media.mediaUrl,
      pageMode: null,
      creator: null,
      browserUrl: null,
    });
  };

  goToLUA = async mediaUrl => {
    if (Strings.isEmpty(mediaUrl)) {
      return;
    }

    this.closeCEF();

    const media = await Actions.getMediaByURL({ mediaUrl });
    const userPlayData = { mediaUrl, ...media };
    this.openCEF(mediaUrl, userPlayData);
    this._history.addItem(media ? media : { mediaUrl });

    amplitude.getInstance().logEvent('OPEN_LUA', {
      mediaUrl,
    });

    const isLocal = Urls.isLocalUrl(mediaUrl);
    const sidebarMode = isLocal ? 'development' : 'current-context';
    this.setStateWithCEF({
      media: media ? { ...media } : { mediaUrl },
      mediaUrl,
      sidebarMode,
      pageMode: null,
      creator: null,
      browserUrl: null,
    });
  };

  _handleNativeOpenUrl = e => {
    let { params } = e;
    let { url } = params;

    if (Strings.isEmpty(url)) {
      return;
    }

    url = url.replace('castle://', 'http://');
    this.setState({ mediaUrl: url }, () => {
      this._handleURLSubmit();
    });
  };

  _handleKeyDown = e => {
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

  _stringAsSearchInvariant = s => {
    return s.toLowerCase().trim();
  };

  _stringIncludesSearchQuery = (s, query) => {
    if (Strings.isEmpty(s)) {
      return false;
    }

    return this._stringAsSearchInvariant(s).includes(query);
  };

  _filterMediaItemWithSearchState = m => {
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

  _filterPlaylistWithSearchState = p => {
    if (!p) {
      return false;
    }
    const query = this._stringAsSearchInvariant(this.state.searchQuery);
    if (this._stringIncludesSearchQuery(p.name, query)) {
      return true;
    }

    if (p.user) {
      if (this._stringIncludesSearchQuery(p.user.name, query)) {
        return true;
      }
      if (this._stringIncludesSearchQuery(p.user.username, query)) {
        return true;
      }
    }

    return false;
  };

  _filterUserWithSearchState = u => {
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

  _handleNavigateToBrowserPage = browserUrl => {
    if (window.cefQuery) {
      CEF.openExternalURL(browserUrl);

      return;
    }

    this.setState({ browserUrl, pageMode: null });
  };

  _handleDismissBrowserPage = () => this.setState({ browserUrl: null });

  _handleSearchSubmit = async e => this._handleSearchChange(e);

  _handleSearchReset = () => {
    this.setState({
      searchQuery: '',
      searchResults: {
        ...this.state.allContent,
      },
      pageMode: 'browse',
    });
  };

  _handleSearchChange = async e => {
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
            playlists: this.state.allContent.playlists.filter(this._filterPlaylistWithSearchState),
            users: this.state.allContent.users.filter(this._filterUserWithSearchState),
          },
        });
      }
    );
  };

  _handleRegisterGame = ({ email, message }) => {
    // TODO(jim): Handle this better
    if (Strings.isEmpty(email)) {
      return;
    }

    // TODO(jim): Handle this better
    if (Strings.isEmpty(message)) {
      return;
    }

    const emailUrl = `<mailto:${email}|${email}>`;
    Slack.sendMessage(`*${emailUrl} who is playing "${this.state.mediaUrl}" said:*\n ${message}`);
  };

  _handlePlaylistSelect = async playlist => {
    const serverPlaylist = await Actions.getPlaylist(playlist);
    if (!serverPlaylist) {
      return;
    }

    this.setState({
      pageMode: 'playlist',
      searchResults: {
        ...this.state.searchResults,
        media:
          serverPlaylist.mediaItems && serverPlaylist.mediaItems.length
            ? [...serverPlaylist.mediaItems]
            : [...this.state.searchResults.media],
      },
      creator: null,
      playlist: serverPlaylist,
      searchQuery: Strings.isEmpty(playlist.name) ? '' : playlist.name.slice(0),
    });
  };

  _handleUserSelect = async user => {
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
        playlist: null,
        searchQuery: '',
        searchResults: {
          ...this.state.allContent,
        },
      });
    }

    this._loadMedia(media);
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
      mediaLoading: false,
      creator: { ...this.state.viewer },
    });
    this.refreshViewer();
  };

  _handleTogglePlay = () => {
    const updates = {
      pageMode: null,
      creator: null,
    };

    // TODO(jim): Won't be necessary when we enable hide.
    if (!Strings.isEmpty(this.state.mediaUrl)) {
      if (Urls.isLua(this.state.mediaUrl)) {
        const userPlayData = {
          mediaUrl: this.state.mediaUrl,
          mediaId: this.state.media ? this.state.media.mediaId : null,
        };
        this.openCEF(this.state.mediaUrl, userPlayData);
      }
    }

    this.setStateWithCEF({
      ...updates,
    });
  };

  _handleToggleBrowse = () => {
    // NOTE(jim):
    // We can probably make this more elegant later.
    if (this.state.pageMode === 'playlist') {
      return;
    }

    const isOwner =
      this.state.viewer &&
      this.state.creator &&
      this.state.viewer.userId === this.state.creator.userId;

    if (this.state.pageMode === 'profile' && this.state.creator && !isOwner) {
      return;
    }

    const updates = {
      pageMode: 'browse',
      mediaLoading: false,
      creator: null,
    };

    this.setStateHideCEF({
      ...updates,
    });
  };

  _handleToggleSignIn = () => {
    const updates = {
      pageMode: 'sign-in',
      mediaLoading: false,
      creator: null,
    };

    this.setStateHideCEF({ ...updates });
  };

  _handleToggleHistory = () => {
    const updates = {
      pageMode: 'history',
      mediaLoading: false,
      creator: null,
    };

    this.setStateHideCEF(updates);
  };

  _handleToggleCurrentPlaylistDetails = () => {
    const updates = {
      pageMode: 'playlist',
      creator: null,
    };

    this.setStateHideCEF({
      ...updates,
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

  _handleToggleOverlay = () => {
    const updates = {
      isOverlayActive: !this.state.isOverlayActive,
      pageMode: null,
    };

    this.setStateWithCEF({
      ...updates,
    });
  };

  _handleGetReference = reference => {
    this._layout = reference;
  };

  renderRootURLInput = () => (
    <CoreRootURLInput
      name="mediaUrl"
      placeholder="Type in the URL to a Castle game..."
      value={this.state.mediaUrl}
      viewer={this.state.viewer}
      media={this.state.media}
      expanded={this.state.isMediaExpanded}
      isLoading={this.state.mediaLoading}
      onChange={this._handleURLChange}
      onSubmit={this.reload}
      onHideOverlay={this._handleHideOverlay}
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
    const isViewerViewingPlaylistScene = state.pageMode === 'playlist';
    const isViewerViewingHistoryScene = state.pageMode === 'history';
    const isViewerPlayingMedia = !state.pageMode;

    const isViewingOwnProfile =
      isViewerViewingProfileScene &&
      state.viewer &&
      state.creator &&
      state.viewer.userId === state.creator.userId;

    // NOTE(jim): Rendering an IFrame while rendering a Lua window will trigger a double Open_URI
    const isRenderingIFrame =
      state.media && !Strings.isEmpty(state.media.mediaUrl) && !Urls.isLua(state.media.mediaUrl);

    const isRenderingBrowser = !Strings.isEmpty(state.browserUrl);

    let maybeFrameNode;
    if (isRenderingIFrame) {
      maybeFrameNode = (
        <CoreMediaScreen
          key="core-media-screen"
          isExpanded={state.isMediaExpanded}
          isVisible={!state.pageMode}
          media={state.media}
        />
      );
    }

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
            isViewerViewingPlaylistScene ||
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
          {maybeFrameNode}
          <CoreBrowseResults
            results={state.searchResults}
            featuredMedia={state.featuredMedia}
            isPristine={Strings.isEmpty(state.searchQuery)}
            searchQuery={state.searchQuery}
            onUserSelect={this._handleUserSelect}
            onMediaSelect={this._handleMediaSelect}
            onPlaylistSelect={this._handlePlaylistSelect}
            onLoadHelp={this._handleLoadTutorial}
            onLoadURL={this.loadURL}
          />
        </CoreLayout>
      );
    }

    if (isViewerViewingSignInScene) {
      return (
        <CoreLayout ref={this._handleGetReference} leftSidebarNode={maybeLeftSidebarNode}>
          {maybeFrameNode}
          <CoreLoginSignup onLogin={this._handleLogin} />
        </CoreLayout>
      );
    }

    if (isViewerViewingHistoryScene) {
      return (
        <CoreLayout ref={this._handleGetReference} leftSidebarNode={maybeLeftSidebarNode}>
          {maybeFrameNode}
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

    if (isViewerViewingPlaylistScene) {
      return (
        <CoreLayout
          ref={reference => {
            this._layout = reference;
          }}
          leftSidebarNode={maybeLeftSidebarNode}>
          {maybeFrameNode}
          <CorePlaylist
            viewer={state.viewer}
            playlist={state.playlist}
            onSearchReset={this._handleSearchReset}
            onDismiss={this._handleSearchReset}
            onUserSelect={this._handleUserSelect}
            onMediaSelect={this._handleMediaSelect}
            onMediaRemoveFromPlaylist={this._handleRemoveMediaFromPlaylist}
          />
        </CoreLayout>
      );
    }

    if (isViewerViewingProfileScene) {
      return (
        <CoreLayout ref={this._handleGetReference} leftSidebarNode={maybeLeftSidebarNode}>
          {maybeFrameNode}
          <CoreProfile
            viewer={state.viewer}
            creator={state.creator}
            onSearchReset={this._handleSearchReset}
            onMediaSelect={this._handleMediaSelect}
            onPlaylistSelect={this._handlePlaylistSelect}
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
          playlist={state.playlist}
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
            ref={c => {
              this._contextSidebar = c;
            }}
            media={state.media}
            viewer={state.viewer}
            storage={this.props.storage}
            searchQuery={state.searchQuery}
            onNavigateToBrowserPage={this._handleNavigateToBrowserPage}
            onRefreshViewer={this.refreshViewer}
            onRegisterMedia={this._handleRegisterGame}
            onToggleBrowse={this._handleToggleBrowse}
            onToggleProfile={this._handleToggleProfile}
            onMediaSelect={this._handleMediaSelect}
            onUserSelect={this._handleUserSelect}
            onViewCurrentPlaylistDetails={this._handleToggleCurrentPlaylistDetails}
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
        {state.mediaLoading ? <CoreLoadingScreen /> : null}
        {maybeFrameNode}
      </CoreLayout>
    );
  }
}
