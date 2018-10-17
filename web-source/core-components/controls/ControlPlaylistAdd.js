import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as Actions from '~/common/actions';
import * as SVG from '~/core-components/primitives/svg';

import { css } from 'react-emotion';

import UIAvatar from '~/core-components/reusable/UIAvatar';
import UIPopover from '~/core-components/reusable/UIPopover';
import DOMRectBoundary from '~/core-components/primitives/DOMRectBoundary';
import UIInput from '~/core-components/reusable/UIInput';
import UILink from '~/core-components/reusable/UILink';
import UIControl from '~/core-components/reusable/UIControl';
import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';

const STYLES_CONTROL = css`
  position: relative;
`;

const STYLES_CONTENT = css`
  padding: 16px 16px 24px 16px;
  line-height: 1.725;
  font-size: 16px;
`;

const STYLES_ACTIONS = css`
  border-top: 1px solid ${Constants.colors.border};
  padding: 8px 16px 8px 16px;
`;

const STYLES_PLAYLIST_ITEM = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: ${Constants.colors.white80};
  cursor: pointer;
  border-top: 1px solid ${Constants.colors.border};

  :first-child {
    border-top: 0px;
  }

  :hover {
    color: ${Constants.colors.yellow};
  }
`;

const STYLES_LEFT = css`
  padding: 8px;
  flex-shrink: 0;
`;

const STYLES_RIGHT = css`
  min-width: 25%;
  width: 100%;
  padding: 8px 8px 8px 8px;
`;

const STYLES_TOP = css`
  font-size: 14px;
  margin: 5px 0 4px 0;
  font-weight: 600;
  width: 100%;
  overflow-wrap: break-word;
`;

const STYLES_BOTTOM = css`
  font-size: 10px;
  font-weight: 200;
  width: 100%;
  overflow-wrap: break-word;
  padding-bottom: 8px;
`;

export default class ControlPlaylistAdd extends React.Component {
  state = {
    visible: false,
  };

  _handleHide = () => {
    this.setState({ visible: false });
  };

  _handleAddMediaToPlaylist = async playlist => {
    await Actions.addMediaToPlaylist({
      mediaId: this.props.media.mediaId,
      playlistId: playlist.playlistId,
    });

    await this.props.onRefreshViewer();

    this.setState({ visible: false });
  };

  _handleToggleShow = () => {
    this.setState({ visible: !this.state.visible });
  };

  render() {
    let playlistElement = (
      <div className={STYLES_CONTENT}>
        You have not created any playlists. To create a playlist, visit your{' '}
        <UILink onClick={this.props.onToggleProfile}>profile</UILink>.
      </div>
    );

    if (this.props.viewer.playlists && this.props.viewer.playlists.length) {
      playlistElement = this.props.viewer.playlists.map(p => {
        return (
          <div
            key={p.playlistId}
            className={STYLES_PLAYLIST_ITEM}
            onClick={() => this._handleAddMediaToPlaylist(p)}>
            <div className={STYLES_LEFT}>
              <UIAvatar icon={<SVG.PlaylistIcon height="20px" />} />
            </div>
            <div className={STYLES_RIGHT}>
              <div className={STYLES_TOP}>Add to "{p.name}"</div>
              <div className={STYLES_BOTTOM}>
                {p.mediaItems.length} {Strings.pluralize('game', p.mediaItems.length)}
              </div>
            </div>
          </div>
        );
      });
    }

    return (
      <DOMRectBoundary
        enabled={this.state.visible}
        className={STYLES_CONTROL}
        onOutsideRectEvent={this._handleHide}
        captureScroll={false}>
        <UIPopover style={{ bottom: 56, left: 0 }} active={this.state.visible}>
          {playlistElement}
          <div className={STYLES_ACTIONS}>
            <UIControl onClick={this._handleHide}>Cancel</UIControl>
          </div>
        </UIPopover>
        <UIButtonIconHorizontal
          icon={<SVG.AddPlaylist height="16px" />}
          onClick={this._handleToggleShow}>
          Add to playlist
        </UIButtonIconHorizontal>
      </DOMRectBoundary>
    );
  }
}
