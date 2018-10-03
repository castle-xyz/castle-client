import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIAvatar from '~/core-components/reusable/UIAvatar';
import UIStat from '~/core-components/reusable/UIStat';
import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';

const STYLES_CONTAINER = css`
  padding: 16px 16px 0 16px;
`;

const STYLES_BODY = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const STYLES_BODY_LEFT = css`
  flex-shrink: 0;
`;

const STYLES_BODY_RIGHT = css`
  min-width: 25%;
  width: 100%;
  color: ${Constants.brand.line};
`;

const STYLES_ROW = css`
  display: flex;
`;

const STYLES_TOP = css``;

const STYLES_TITLE = css`
  font-size: 24px;
  font-weight: 700;
`;

const STYLES_META = css`
  margin: 8px 0 16px 0;
  font-size: 10px;
`;

const STYLES_DESCRIPTION = css`
  margin: 16px 0 48px 0;
  line-height: 1.5;
  font-size: 16px;
  font-weight: 300;
`;

const STYLES_NAVIGATION_ITEM = css`
  background: ${Constants.brand.line};
  padding: 8px 16px 8px 16px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

// TODO(jim): Plop in a rich text editor rendering component
// since description is not a string.
export default class UICardProfileHeader extends React.Component {
  render() {
    const isViewingMedia = this.props.profileMode === 'media' || !this.props.profileMode;
    const isViewingPlaylists = this.props.profileMode === 'playlists';

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
              <div className={STYLES_TITLE}>{this.props.creator.username}</div>
              <div className={STYLES_META}>
                Joined on {Strings.toDate(this.props.creator.createdTime)}
              </div>
            </div>
            <div className={STYLES_DESCRIPTION}>{this.props.creator.description}</div>
          </div>
        </div>
        <div className={STYLES_ROW}>
          <div
            className={STYLES_NAVIGATION_ITEM}
            style={{
              marginRight: 16,
              background: isViewingMedia ? null : Constants.brand.background,
              color: isViewingMedia ? null : Constants.brand.line,
            }}
            onClick={this.props.onShowMediaList}>
            Media
          </div>

          <div
            className={STYLES_NAVIGATION_ITEM}
            style={{
              background: isViewingPlaylists ? null : Constants.brand.background,
              color: isViewingPlaylists ? null : Constants.brand.line,
            }}
            onClick={this.props.onShowPlaylistList}>
            Playlists
          </div>
        </div>
      </div>
    );
  }
}
