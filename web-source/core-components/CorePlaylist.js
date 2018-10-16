import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIHeaderDismiss from '~/core-components/reusable/UIHeaderDismiss';
import UIListMedia from '~/core-components/reusable/UIListMedia';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';
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
  line-height: 1.5;
  font-size: 16px;
  font-weight: 300;
`;

const STYLES_HEADING = css`
  font-size: 48px;
  line-height: 56px;
  font-weight: 700;
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
            Created on {Strings.toDate(this.props.playlist.createdTime)}
          </div>
          {rich ? <ContentEditor readOnly value={rich} /> : <p className={STYLES_PARAGRAPH} />}
        </div>
        {this.props.playlist.mediaItems && this.props.playlist.mediaItems.length ? (
          <UIListMedia
            viewer={this.props.viewer}
            creator={this.props.playlist.user}
            mediaItems={this.props.playlist.mediaItems}
            onUserSelect={this.props.onUserSelect}
            onMediaRemove={this.props.onMediaRemove}
            onMediaSelect={this.props.onMediaSelect}
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
