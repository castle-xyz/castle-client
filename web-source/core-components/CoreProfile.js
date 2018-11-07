import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIControl from '~/core-components/reusable/UIControl';
import UICardProfileHeader from '~/core-components/reusable/UICardProfileHeader';
import UIListMedia from '~/core-components/reusable/UIListMedia';
import UIListPlaylists from '~/core-components/reusable/UIListPlaylists';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';

import CoreBrowseSearchInput from '~/core-components/CoreBrowseSearchInput';
import CoreEditProfile from '~/core-components/CoreEditProfile';
import CoreProfileAddMedia from '~/core-components/CoreProfileAddMedia';
import CoreProfileAddPlaylist from '~/core-components/CoreProfileAddPlaylist';

const STYLES_HEADER_TEXT = css`
  font-size: 16px;
`;

const STYLES_CONTAINER = css`
  @keyframes info-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: info-animation 280ms ease;

  width: 100%;
  min-width: 25%;
  height: 100%;
  overflow-y: scroll;
  background ${Constants.colors.background};
  color: ${Constants.colors.white};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

export default class CoreProfile extends React.Component {
  state = {
    mode: 'media',
  };

  componentWillReceiveProps(nextProps) {
    const existingUserId = (this.props.creator && this.props.creator.userId) ?
          this.props.creator.userId :
          null;
    const nextUserId = (nextProps.creator && nextProps.creator.userId) ?
          nextProps.creator.userId :
          null
    if (nextUserId != existingUserId) {
      // we're rendering a new profile, reset state.
      this.setState({ mode: 'media' });
    }
  }
  
  _onShowMedia = () => this.setState({ mode: 'media' });

  _onShowPlaylists = () => this.setState({ mode: 'playlists' });

  _onShowEditProfile = () => this.setState({ mode: 'edit-profile' });
  
  _renderMediaContent = (isOwnProfile) => {
    const mediaListElement =
      this.props.creator.mediaItems && this.props.creator.mediaItems.length ? (
        <UIListMedia
          viewer={this.props.viewer}
          creator={this.props.creator}
          mediaItems={this.props.creator.mediaItems}
          onMediaSelect={this.props.onMediaSelect}
          onMediaRemove={this.props.onMediaRemove}
          onUserSelect={this.props.onUserSelect}
        />
      ) : (
        <UIEmptyState
          title="No media yet"
          style={{ borderTop: `1px solid ${Constants.colors.border}` }}>
          {isOwnProfile
            ? 'You have not added any media to your profile yet.'
            : 'This user has not added any media yet.'}
        </UIEmptyState>
      );
    return (
      <div>
        {mediaListElement}
        {isOwnProfile ? (<CoreProfileAddMedia onMediaAdd={this.props.onMediaAdd} />) : null}
      </div>
    );
  }

  _renderPlaylistContent = (isOwnProfile) => {
    const playlistListElement =
      this.props.creator.playlists && this.props.creator.playlists.length ? (
        <UIListPlaylists
          viewer={this.props.viewer}
          creator={this.props.creator}
          playlists={this.props.creator.playlists}
          onPlaylistSelect={this.props.onPlaylistSelect}
          onPlaylistRemove={this.props.onPlaylistRemove}
          onUserSelect={this.props.onUserSelect}
        />
      ) : (
        <UIEmptyState
          title="No playlists yet"
          style={{ borderTop: `1px solid ${Constants.colors.border}` }}>
          {isOwnProfile
            ? 'You have not created any playlists yet.'
            : 'This user has not added any playlists yet.'}
        </UIEmptyState>
      );
    return (
      <div>
        {playlistListElement}
        {isOwnProfile ? (<CoreProfileAddPlaylist onPlaylistAdd={this.props.onPlaylistAdd} />) : null}
      </div>
    );
  }

  _renderEditProfileContent = (isOwnProfile) => {
    if (!isOwnProfile) return null;
    
    return (
      <CoreEditProfile user={this.props.viewer} />
    );
  }
  
  render() {
    const isOwnProfile = (
      this.props.viewer &&
      this.props.viewer.userId == this.props.creator.userId
    );

    let profileContentElement;
    const { mode } = this.state;
    if (mode === 'playlists') {
      profileContentElement = this._renderPlaylistContent(isOwnProfile);
    } else if (mode === 'edit-profile') {
      profileContentElement = this._renderEditProfileContent(isOwnProfile);
    } else {
      profileContentElement = this._renderMediaContent(isOwnProfile);
    }

    return (
      <div className={STYLES_CONTAINER}>
        {!isOwnProfile ? (
          <CoreBrowseSearchInput
            readOnly
            searchQuery={this.props.creator.username}
            onSearchReset={this.props.onSearchReset}
          />
        ) : null}
        <UICardProfileHeader
          creator={this.props.creator}
          profileMode={this.state.mode}
          isOwnProfile={isOwnProfile}
          onShowMediaList={this._onShowMedia}
          onShowPlaylistList={this._onShowPlaylists}
          onShowEditProfile={this._onShowEditProfile}
          onSignOut={this.props.onSignOut}
        />
        {profileContentElement}
      </div>
    );
  }
}
