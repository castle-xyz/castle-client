import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';
import * as SVG from '~/core-components/primitives/svg';

import { css } from 'react-emotion';

import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';
import UIControl from '~/core-components/reusable/UIControl';
import UICardProfileHeader from '~/core-components/reusable/UICardProfileHeader';
import UIHorizontalNavigation from '~/core-components/reusable/UIHorizontalNavigation';
import UIListMedia from '~/core-components/reusable/UIListMedia';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';

import CoreBrowseSearchInput from '~/core-components/CoreBrowseSearchInput';
import CoreEditProfile from '~/core-components/CoreEditProfile';
import CoreProfileEditMedia from '~/core-components/CoreProfileEditMedia';
import CoreSignOut from '~/core-components/CoreSignOut';

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
    isEditingMedia: false,
    mediaToEdit: null,
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
      this.setState({
        mode: 'media',
        isEditingMedia: false,
        mediaToEdit: null,
      });
    }
  };
  
  _onShowMedia = () => this.setState({
    mode: 'media',
    isEditingMedia: false,
    mediaToEdit: null,
  });

  _onShowEditProfile = () => this.setState({ mode: 'edit-profile' });

  _onShowSignOut = () => this.setState({ mode: 'sign-out' });

  _onSelectEditMedia = (media) => this.setState({
    mode: 'media',
    isEditingMedia: true,
    mediaToEdit: media,
  });
  
  _onAfterEditMedia = () => {
    // after creating/editing media, back out to the full list of media
    this.setState({
      mode: 'media',
      isEditingMedia: false,
      mediaToEdit: null,
    });
    if (this.props.onAfterSave) {
      this.props.onAfterSave();
    }
  };

  _getNavigationItems = (isOwnProfile) => {
    let navigationItems = [
      { label: 'Games', key: 'media' },
    ];

    if (isOwnProfile) {
      navigationItems.push({ label: 'Edit Profile', key: 'edit-profile' });
      navigationItems.push({ label: 'Sign Out', key: 'sign-out' });
    }

    return navigationItems;
  }

  _onNavigationChange = (selectedKey) => {
    const callbacks = {
      'media': this._onShowMedia,
      'edit-profile': this._onShowEditProfile,
      'sign-out': this._onShowSignOut,
    }
    if (callbacks.hasOwnProperty(selectedKey)) {
      callbacks[selectedKey]();
    }
  }
  
  _renderMediaContent = (isOwnProfile) => {
    const { isEditingMedia, mediaToEdit } = this.state;
    if (isEditingMedia) {
      return (
        <CoreProfileEditMedia
          media={mediaToEdit}
          onAfterSave={this._onAfterEditMedia}
        />
      );
    } else {
      const mediaListElement =
        this.props.creator.mediaItems && this.props.creator.mediaItems.length ? (
          <UIListMedia
            noTitleRow
            viewer={this.props.viewer}
            creator={this.props.creator}
            mediaItems={this.props.creator.mediaItems}
            onMediaSelect={this.props.onMediaSelect}
            onMediaEdit={this._onSelectEditMedia}
            onUserSelect={this.props.onUserSelect}
          />
        ) : (
          <UIEmptyState
            title="No media yet"
            style={{ borderTop: `16px solid ${Constants.colors.border}` }}>
            {isOwnProfile
              ? 'You have not added any games to your profile yet.'
              : 'This user has not added any games yet.'}
          </UIEmptyState>
        );
      const addMediaIcon = (<SVG.Add height="16px" />);
      const maybeAddMediaElement =
        isOwnProfile ? (
          <UIButtonIconHorizontal
            style={{ margin: 16 }}
            onClick={() => this._onSelectEditMedia(null)}
            icon={addMediaIcon}>
            Add Your Games
          </UIButtonIconHorizontal>
        ) : null;
      return (
        <div>
          {mediaListElement}
          {maybeAddMediaElement}
        </div>
      );
    }
  }

  _renderEditProfileContent = (isOwnProfile) => {
    if (!isOwnProfile) return null;
    
    return (
      <CoreEditProfile
        user={this.props.viewer}
        onAfterSave={this.props.onAfterSave}
      />
    );
  };

  _renderSignOutContent = (isOwnProfile) => {
    if (!isOwnProfile) return null;
    return (
      <CoreSignOut onSignOut={this.props.onSignOut} />
    );
  };
  
  render() {
    const isOwnProfile = (
      this.props.viewer &&
      this.props.viewer.userId == this.props.creator.userId
    );

    let profileContentElement;
    const { mode } = this.state;
    if (mode === 'edit-profile') {
      profileContentElement = this._renderEditProfileContent(isOwnProfile);
    } else if (mode === 'sign-out') {
      profileContentElement = this._renderSignOutContent(isOwnProfile);
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
          isOwnProfile={isOwnProfile}
          onMediaSelect={this.props.onMediaSelect}
        />
        <UIHorizontalNavigation
          items={this._getNavigationItems(isOwnProfile)}
          selectedKey={this.state.mode}
          onChange={this._onNavigationChange}
        />
        {profileContentElement}
      </div>
    );
  }
}
