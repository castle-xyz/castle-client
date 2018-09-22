import * as React from 'react';
import * as Strings from '~/common/strings';
import * as Utilities from '~/common/utilities';
import * as ReactDOM from 'react-dom';
import * as Fixtures from '~/common/fixtures';
import * as Slack from '~/common/slack';

import { css } from 'react-emotion';
import { isKeyHotkey } from 'is-hotkey';

import GhostApiClientConstructor from 'ghost-api-client';
const API = new GhostApiClientConstructor();

// NOTE(jim): Reusable layout component.
import CoreLayout from '~/core-components/layouts/CoreLayout';

// NOTE(jim): Root Components
import CoreRootHeader from '~/core-components/CoreRootHeader';
import CoreRootURLInput from '~/core-components/CoreRootURLInput';
import CoreRootAuthenticatedSidebar from '~/core-components/CoreRootAuthenticatedSidebar';
import CoreRootDashboard from '~/core-components/CoreRootDashboard';
import CoreRootToolbar from '~/core-components/CoreRootToolbar';
import CoreRootPlaylistSidebar from '~/core-components/CoreRootPlaylistSidebar';
import CoreRootAuthenticateForm from '~/core-components/CoreRootAuthenticateForm';

// NOTE(jim): Media Scene
import CoreMediaScreen from '~/core-components/CoreMediaScreen';
import CoreMediaInformation from '~/core-components/CoreMediaInformation';
import CoreMediaScoreInformation from '~/core-components/CoreMediaScoreInformation';

// NOTE(jim): Browse Scene
import CoreBrowsePlaylistResults from '~/core-components/CoreBrowsePlaylistResults';
import CoreBrowseMediaResults from '~/core-components/CoreBrowseMediaResults';
import CoreBrowseSearchInput from '~/core-components/CoreBrowseSearchInput';

// NOTE(jim): Profile Scene
import CoreProfile from '~/core-components/CoreProfile';

// NOTE(jim): Playlist Scene
import CorePlaylist from '~/core-components/CorePlaylist';

// NOTE(jim): Development Logs Scene
import CoreDevelopmentLogs from '~/core-components/CoreDevelopmentLogs';

// NOTE: Welcome Scene
import CoreWelcomeScreen from '~/core-components/CoreWelcomeScreen';

const isOverlayHotkey = isKeyHotkey('mod+e');
const isDevelopmentLogHotkey = isKeyHotkey('mod+j');

export default class CoreApp extends React.Component {
  _layout;
  _devTimeout;

  constructor(props) {
    super();

    this.state = props.state;
  }

  async componentDidMount() {
    window.addEventListener('nativeOpenUrl', this._handleNativeOpenUrl);
    window.addEventListener('keydown', this._handleKeyDown);
    this._handleSetGameWindowSize();

    // TODO(jim): Move this somewhere else.
    const processChannels = () => {
      if (!window.cefQuery) {
        console.error('window.cefQuery is undefined');
        return;
      }

      window.cefQuery({
        request: JSON.stringify({
          type: 'READ_CHANNELS',
          body: { channelNames: ['PRINT', 'ERROR'] },
        }),
        onSuccess: json => {
          const channels = JSON.parse(json);

          const logs = [];
          channels.PRINT.map(json => {
            const params = JSON.parse(json);
            logs.push({ type: 'print', text: `${params.join(' ')}` });
          });

          channels.ERROR.map(json => {
            const error = JSON.parse(json).error;
            logs.push({ type: 'error', text: `${error}` });
          });
          this.setState({ logs: [...logs, ...this.state.logs] });

          this._devTimeout = setTimeout(processChannels);
        },
      });
    };

    this._devTimeout = setTimeout(processChannels);

    const playlist = await API.callAsync('getCurrentJamPlaylist');
    this.setState({ playlist });
  }

  componentWillUnmount() {
    window.removeEventListener('nativeOpenUrl', this._handleNativeOpenUrl);
    window.removeEventListener('keydown', this._handleKeyDown);
    window.clearTimeout(this._devTimeout);
  }

  _handleSetHistory = media => {
    const data = this.props.storage.getItem('history');

    // TODO(jim): Sync this with your profile if you're logged in.
    if (!data) {
      console.log('Setting up your local viewing history.');
      this.props.storage.setItem('history', JSON.stringify({ history: [] }));
    }

    let { history } = JSON.parse(data);

    if (!history) {
      return;
    }

    history = history.filter(h => h.mediaUrl !== media.mediaUrl);

    history.unshift(media);
    this.props.storage.setItem('history', JSON.stringify({ history }));

    if (history.length > 10) {
      history.pop();
    }
  };

  _handleSetGameWindowSize = () => {
    const element = this._layout.getMediaContainerRef();
    const rect = element.getBoundingClientRect();

    if (!window.cefQuery) {
      return;
    }

    // TODO(jim): Move window calls somewhere else.
    try {
      window.cefQuery({
        request: JSON.stringify({
          type: 'SET_CHILD_WINDOW_FRAME',
          body: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
        }),
      });
    } catch (e) {
      alert('`cefQuery`: ' + e.message);
    }
  };

  _handleURLChange = e => this.setState({ [e.target.name]: e.target.value });

  _handleURLSubmit = () => {
    if (this.state.mediaUrl.endsWith('index.html')) {
      this._handleGoToMedia({ mediaUrl: this.state.mediaUrl });
      return;
    }

    if (!window.cefQuery) {
      return;
    }

    this._handleGoToUrl(this.state.mediaUrl);
  };

  _handleGoToMedia = media => {
    if (window.cefQuery) {
      window.cefQuery({
        request: JSON.stringify({
          type: 'CLOSE',
          body: '',
        }),
      });
    }

    this._handleSetHistory(media);
    this.setState({ media, mediaUrl: media.mediaUrl });
  };

  _handleGoToUrl = mediaUrl => {
    this.setState({ media: null });

    try {
      window.cefQuery({
        request: JSON.stringify({
          type: 'OPEN_URI',
          body: {
            uri: mediaUrl,
          },
        }),
      });
    } catch (e) {
      alert('`cefQuery`: ' + e.message);
    }

    this._handleSetHistory({ mediaUrl });
    this.setState({ media: { mediaUrl }, mediaUrl });
  };

  _handleNativeOpenUrl = e => {
    let { params } = e;
    let { url } = params;
    if (url) {
      url = url.replace('castle://', 'https://');
      this.setState({ media: null });
      this.setState({ mediaUrl: url }, () => {
        this._handleURLSubmit();
      });
    }
  };

  _handleKeyDown = e => {
    if (isOverlayHotkey(e)) {
      return this._handleToggleOverlay();
    }

    if (isDevelopmentLogHotkey(e)) {
      return this._handleToggleDevelopmentLogs();
    }
  };

  _handleSignOut = () => {
    this.setState({ viewer: null, pageMode: null }, this._handleSetGameWindowSize);
  };

  _handleSignIn = () => {
    this.setState(
      { viewer: Fixtures.User, pageMode: null, sidebarMode: null },
      this._handleSetGameWindowSize
    );
  };

  _handleAuthChange = e => {
    this.setState({ local: { ...this.state.local, [e.target.name]: e.target.value } });
  };

  _handleSearchSubmit = () => {
    this.setState({
      searchResultsMedia: Fixtures.SearchResults,
    });
  };

  _handleSearchChange = e => {
    this.setState({
      searchQuery: e.target.value,
    });
  };

  _handleToggleBrowse = () => {
    this.setState({ pageMode: this.state.pageMode === 'browse' ? null : 'browse' });
  };

  _handleToggleProfile = () => {
    this.setState({ pageMode: this.state.pageMode === 'profile' ? null : 'profile' });
  };

  _handleToggleCurrentPlaylistDetails = () => {
    this.setState({
      pageMode: this.state.pageMode === 'playlist' ? null : 'playlist',
    });
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

  _handleFavoriteMedia = () => window.alert('favorite');

  _handleMediaSelect = media => {
    if (media.mediaUrl.endsWith('index.html')) {
      this._handleGoToMedia(media);
      return;
    }

    this._handleGoToUrl(media.mediaUrl);
  };

  _handleSelectRandom = () => {
    if (!this.state.playlist || !this.state.playlist.mediaItems.length) {
      return;
    }

    const max = this.state.playlist.mediaItems.length;
    const min = 1;

    const index = Utilities.getRandomInt(min, max);
    this._handleMediaSelect(this.state.playlist.mediaItems[index]);
  };

  _handlePlayCreatorMedia = creator => {
    console.log({ creator });
  };

  _handleSubscribeToCreator = creator => {
    console.log({ creator });
  };

  _handleClickCreatorAvatar = creator => {
    console.log({ creator });
  };

  _handleClickCreatorCreations = creator => {
    console.log({ creator });
  };

  _handleClickCreatorPlaylists = creator => {
    console.log({ creator });
  };

  _handleToggleCurrentPlaylist = () => {
    this.setState(
      {
        sidebarMode: this.state.sidebarMode === 'current-playlist' ? null : 'current-playlist',
      },
      this._handleSetGameWindowSize
    );
  };

  _handleToggleDashboard = () => {
    this.setState(
      {
        sidebarMode: this.state.sidebarMode === 'dashboard' ? null : 'dashboard',
      },
      this._handleSetGameWindowSize
    );
  };

  _handleToggleAuthentication = () => {
    this.setState(
      {
        viewer: this.state.viewer ? null : this.state.viewer,
        sidebarMode: this.state.viewer ? null : 'authentication',
      },
      this._handleSetGameWindowSize
    );
  };

  _handleToggleDevelopmentLogs = () => {
    this.setState(
      {
        sidebarMode: this.state.sidebarMode === 'development' ? null : 'development',
      },
      this._handleSetGameWindowSize
    );
  };

  _handleToggleMediaInfo = () => {
    this.setState(
      {
        sidebarMode: this.state.sidebarMode === 'media-info' ? null : 'media-info',
      },
      this._handleSetGameWindowSize
    );
  };

  _handleShowProfileMediaList = () => {
    this.setState({
      profileMode: 'media',
    });
  };

  _handleShowProfilePlaylistList = () => {
    this.setState({
      profileMode: 'playlists',
    });
  };

  _handleDismissSidebar = () => {
    this.setState({ sidebarMode: null }, this._handleSetGameWindowSize);
  };

  _handleToggleScore = () => {
    this.setState({ isScoreVisible: !this.state.isScoreVisible }, this._handleSetGameWindowSize);
  };

  _handleDismissScore = () => {
    this.setState({ isScoreVisible: false }, this._handleSetGameWindowSize);
  };

  _handleHideOverlay = () => {
    this.setState({ isOverlayActive: false }, this._handleSetGameWindowSize);
  };

  _handleToggleOverlay = () => {
    this.setState({ isOverlayActive: !this.state.isOverlayActive }, this._handleSetGameWindowSize);
  };

  _handleToggleMediaExpanded = () => {
    this.setState({ isMediaExpanded: !this.state.isMediaExpanded }, this._handleSetGameWindowSize);
  };

  render() {
    const { state } = this;

    let maybeLeftSidebarNode;
    if (state.isOverlayActive && state.viewer) {
      maybeLeftSidebarNode = (
        <CoreRootAuthenticatedSidebar
          viewer={state.viewer}
          onToggleProfile={this._handleToggleProfile}
          onToggleBrowse={this._handleToggleBrowse}
        />
      );
    }

    // NOTE(jim): Browse/Search Scene
    if (state.pageMode === 'browse') {
      return (
        <CoreLayout
          topNode={
            <CoreBrowseSearchInput
              searchQuery={state.searchQuery}
              onChange={this._handleSearchChange}
              onSubmit={this._handleSearchSubmit}
            />
          }
          rightSidebarNode={<CoreBrowsePlaylistResults onDismiss={this._handleToggleBrowse} />}
          leftSidebarNode={maybeLeftSidebarNode}>
          <CoreBrowseMediaResults media={state.searchResultsMedia} />
        </CoreLayout>
      );
    }

    // NOTE(jim): Playlist Scene.
    // TODO(jim): Reusable Components.
    if (state.pageMode === 'playlist') {
      return (
        <CoreLayout leftSidebarNode={maybeLeftSidebarNode}>
          <CorePlaylist onDismiss={this._handleToggleCurrentPlaylistDetails} />
        </CoreLayout>
      );
    }

    // NOTE(jim): Profile Scene
    if (state.pageMode === 'profile') {
      return (
        <CoreLayout leftSidebarNode={maybeLeftSidebarNode}>
          <CoreProfile
            creator={state.viewer}
            profileMode={state.profileMode}
            onSignOut={this._handleSignOut}
            onDismiss={this._handleToggleProfile}
            onShowProfileMediaList={this._handleShowProfileMediaList}
            onShowProfilePlaylistList={this._handleShowProfilePlaylistList}
            onPlayCreatorMedia={this._handlePlayCreatorMedia}
            onSubscribeToCreator={this._handleSubscribeToCreator}
            onClickCreatorAvatar={this._handleClickCreatorAvatar}
            onClickCreatorCreations={this._handleClickCreatorCreations}
            onClickCreatorPlaylists={this._handleClickCreatorPlaylists}
          />
        </CoreLayout>
      );
    }

    // NOTE(jim): Media Page
    let maybeBottomNode;
    if (state.isOverlayActive) {
      maybeBottomNode = (
        <CoreRootURLInput
          name="mediaUrl"
          value={state.mediaUrl}
          viewer={state.viewer}
          media={state.media}
          expanded={state.isMediaExpanded}
          onChange={this._handleURLChange}
          onSubmit={this._handleURLSubmit}
          onToggleMediaExpanded={this._handleToggleMediaExpanded}
          onHideOverlay={this._handleHideOverlay}
          onFavoriteMedia={this._handleFavoriteMedia}
          onToggleDashboard={this._handleToggleDashboard}
        />
      );
    }

    let maybeTopNode;
    if (state.isOverlayActive) {
      maybeTopNode = (
        <CoreRootHeader
          viewer={state.viewer}
          media={state.media}
          playlist={state.playlist}
          onSelectRandom={this._handleSelectRandom}
          onToggleDashboard={this._handleToggleDashboard}
          onToggleAuthentication={this._handleToggleAuthentication}
          onToggleMediaInfo={this._handleToggleMediaInfo}
          onToggleScores={this._handleToggleScore}
          onToggleCurrentPlaylist={this._handleToggleCurrentPlaylist}
        />
      );
    }

    let maybeRightSidebarNode;
    if (state.isOverlayActive && state.isScoreVisible) {
      maybeRightSidebarNode = <CoreMediaScoreInformation onDismiss={this._handleDismissScore} />;
    }

    let maybeRightNode;
    if (state.isOverlayActive && state.sidebarMode === 'media-info') {
      maybeRightNode = (
        <CoreMediaInformation
          media={state.media}
          onDismiss={this._handleDismissSidebar}
          onRegisterMedia={this._handleRegisterGame}
        />
      );
    }

    if (state.isOverlayActive && state.sidebarMode === 'development') {
      maybeRightNode = (
        <CoreDevelopmentLogs logs={state.logs} onDismiss={this._handleDismissSidebar} />
      );
    }

    if (state.isOverlayActive && state.sidebarMode === 'authentication') {
      maybeRightNode = (
        <CoreRootAuthenticateForm
          onDismiss={this._handleDismissSidebar}
          onChange={this._handleAuthChange}
          onSubmit={this._handleSignIn}
        />
      );
    }

    if (state.isOverlayActive && state.sidebarMode === 'dashboard') {
      maybeRightNode = (
        <CoreRootDashboard
          media={state.media}
          onMediaSelect={this._handleMediaSelect}
          storage={this.props.storage}
          onDismiss={this._handleDismissSidebar}
        />
      );
    }

    if (state.isOverlayActive && state.sidebarMode === 'current-playlist') {
      maybeRightNode = (
        <CoreRootPlaylistSidebar
          media={state.media}
          playlist={state.playlist}
          onMediaSelect={this._handleMediaSelect}
          onViewCurrentPlaylistDetails={this._handleToggleCurrentPlaylistDetails}
          onDismiss={this._handleDismissSidebar}
        />
      );
    }

    // TODO: wire up CoreWelcomeScreen random action
    return (
      <CoreLayout
        ref={reference => {
          this._layout = reference;
        }}
        topNode={maybeTopNode}
        bottomNode={maybeBottomNode}
        leftSidebarNode={maybeLeftSidebarNode}
        rightSidebarNode={maybeRightSidebarNode}
        rightNode={maybeRightNode}>
        {state.media ? (
          <CoreMediaScreen expanded={state.isMediaExpanded} media={state.media} />
        ) : (
          <CoreWelcomeScreen
            onToggleSidebar={this.state.playlist ? this._handleToggleCurrentPlaylist : null}
            onSelectRandom={this.state.playlist ? this._handleSelectRandom : null}
          />
        )}
      </CoreLayout>
    );
  }
}
