import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIHeaderDismiss from '~/core-components/reusable/UIHeaderDismiss';
import UIListMedia from '~/core-components/reusable/UIListMedia';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';
import UILink from '~/core-components/reusable/UILink';
import ContentEditor from '~/editor/ContentEditor';

const STYLES_CONTAINER = css`
  @keyframes playlist-scene-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: playlist-scene-animation 280ms ease;

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

const STYLES_PLAYLIST_CARD = css`
  padding: 16px 16px 48px 16px;
  background ${Constants.colors.background};
  color: ${Constants.colors.white};
  border-bottom: 1px solid ${Constants.colors.border};
`;

const STYLES_PARAGRAPH = css`
  line-height: 1.725;
  font-weight: 200;
  font-size: 16px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
`;

const STYLES_HEADING = css`
  font-size: 48px;
  line-height: 52px;
  font-weight: 400;
`;

const STYLES_META = css`
  margin: 4px 0 32px 0;
  font-size: 10px;
`;

export default class CorePlaylist extends React.Component {
  render() {
    let rich =
      this.props.playlist &&
      this.props.playlist.description &&
      this.props.playlist.description.rich;
    if (rich) {
      rich = Strings.loadEditor(rich);
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_PLAYLIST_CARD}>
          <h1 className={STYLES_HEADING}>{this.props.playlist.name}</h1>
          <div className={STYLES_META}>
            Created on {Strings.toDate(this.props.playlist.createdTime)} by{' '}
            <UILink onClick={() => this.props.onUserSelect(this.props.playlist.user)}>
              {this.props.playlist.user.username}
            </UILink>
          </div>
          {rich ? (
            <ContentEditor readOnly className={STYLES_PARAGRAPH} value={rich} />
          ) : (
            <p className={STYLES_PARAGRAPH} />
          )}
        </div>
        {this.props.playlist.mediaItems && this.props.playlist.mediaItems.length ? (
          <UIListMedia
            viewer={this.props.viewer}
            creator={this.props.playlist.user}
            mediaItems={this.props.playlist.mediaItems}
            playlist={this.props.playlist}
            onUserSelect={this.props.onUserSelect}
            onMediaSelect={this.props.onMediaSelect}
            onMediaRemoveFromPlaylist={this.props.onMediaRemoveFromPlaylist}
          />
        ) : (
          <UIEmptyState title="There is nothing here yet">
            When media is added to the playlist it will appear here.
          </UIEmptyState>
        )}
      </div>
    );
  }
}
