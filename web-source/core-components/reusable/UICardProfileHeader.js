import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/core-components/primitives/svg';

import { css } from 'react-emotion';

import UIAvatar from '~/core-components/reusable/UIAvatar';
import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';

const STYLES_CONTAINER = css`
  padding: 16px 16px 0 16px;
`;

const STYLES_BODY = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 48px;
`;

const STYLES_BODY_LEFT = css`
  flex-shrink: 0;
`;

const STYLES_BODY_RIGHT = css`
  min-width: 25%;
  width: 100%;
  color: ${Constants.colors.white};
`;

const STYLES_ROW = css`
  display: flex;
`;

const STYLES_TOP = css`
  display: flex;
`;

const STYLES_TITLE = css`
  font-size: 48px;
  line-height: 52px;
  font-weight: 400;
`;

const STYLES_META = css`
  margin: 4px 0 32px 0;
  font-size: 10px;
`;

const STYLES_DESCRIPTION = css`
  line-height: 1.725;
  font-weight: 200;
  font-size: 16px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 16px;
`;

const STYLES_NAVIGATION_ITEM = css`
  background: ${Constants.colors.foreground};
  user-select: none;
  padding: 8px 16px 8px 16px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const STYLES_CREATOR_IDENTITY = css`

`;

// TODO(jim): Plop in a rich text editor rendering component
// since description is not a string.
export default class UICardProfileHeader extends React.Component {
  _renderTagline = creator => {
    if (creator.isReal) {
      return `Joined on ${Strings.toDate(creator.createdTime)}`;
    } else {
      // not real, so don't attribute the action of joining to them.
      if (creator.userId.includes('user:itch')) {
        return 'Creator on itch.io';
      } else {
        return '';
      }
    }
  }

  _renderOwnProfileActions = () => {
    return (
      <UIButtonIconHorizontal
        onClick={this.props.onSignOut}
        icon={<SVG.Logout height="16px" />}>
        Sign out
      </UIButtonIconHorizontal>
    );
  }

  render() {
    const isViewingMedia = this.props.profileMode === 'media' || !this.props.profileMode;
    const isViewingPlaylists = this.props.profileMode === 'playlists';
    const isViewingEditProfile = this.props.profileMode === 'edit-profile';

    let richDescription;
    if (this.props.creator &&
        this.props.creator.description &&
        this.props.creator.description.rich) {
      richDescription = Strings.loadEditor(this.props.creator.description.rich);
    }
    const descriptionElement = richDescription ? (
      <ContentEditor readOnly value={richDescription} className={STYLES_DESCRIPTION} />
    ) : (
      <p className={STYLES_DESCRIPTION}>
        {this.props.creator.description}
      </p>
    );

    const ownProfileActionsElement = (this.props.isOwnProfile) ? this._renderOwnProfileActions() : null;

    const playlistsNavigationElement = this.props.creator.isReal ? (
      <div
        className={STYLES_NAVIGATION_ITEM}
        style={{
          marginRight: 16,
          background: isViewingPlaylists ? null : Constants.colors.background,
        }}
        onClick={this.props.onShowPlaylistList}>
        Playlists
      </div>
    ) : null;

    const editProfileNavigationElement = this.props.isOwnProfile ? (
      <div
        className={STYLES_NAVIGATION_ITEM}
        style={{
          marginRight: 16,
          background: isViewingEditProfile ? null : Constants.colors.background,
        }}
        onClick={this.props.onShowEditProfile}>
        Edit Profile
      </div>
    ) : null;
    
    return (
      <div
        className={STYLES_CONTAINER}
        style={this.props.style}
        onClick={this.props.onClick}
        style={{ background: Constants.brand.background }}>
        <div className={STYLES_BODY}>
          <div className={STYLES_BODY_LEFT} />
          <div className={STYLES_BODY_RIGHT}>
            <div className={STYLES_TOP}>
              <UIAvatar
                user={this.props.creator}
                style={{ width: 64, height: 64, marginRight: 12, marginTop: 6 }}
              />
              <div className={STYLES_CREATOR_IDENTITY}>
                <div className={STYLES_TITLE}>{this.props.creator.username}</div>
                <div className={STYLES_META}>
                  {this._renderTagline(this.props.creator)}
                </div>
              </div>
            </div>
            {descriptionElement}
            {ownProfileActionsElement}
          </div>
        </div>
        <div className={STYLES_ROW}>
          <div
            className={STYLES_NAVIGATION_ITEM}
            style={{
              marginRight: 16,
              background: isViewingMedia ? null : Constants.colors.background,
            }}
            onClick={this.props.onShowMediaList}>
            Media
          </div>
          {playlistsNavigationElement}
          {editProfileNavigationElement}
        </div>
      </div>
    );
  }
}
