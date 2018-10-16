import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIListMediaInPlaylist from '~/core-components/reusable/UIListMediaInPlaylist';
import UIHeaderDismiss from '~/core-components/reusable/UIHeaderDismiss';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';
import UILink from '~/core-components/reusable/UILink';
import UIControl from '~/core-components/reusable/UIControl';

const STYLES_FIXED_CONTAINER = css`
  position: relative;
  width: 420px;
  height: 100%;
  padding-top: 48px;
  border-left: 1px solid ${Constants.colors.border};
`;

const STYLES_FIXED_HEADER = css`
  background: ${Constants.colors.background};
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
`;

const STYLES_CONTAINER = css`
  @keyframes playlist-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: playlist-animation 280ms ease;

  width: 420px;
  height: 100%;
  overflow-y: scroll;
  background ${Constants.colors.background};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

export default class CoreRootContextSidebar extends React.Component {
  render() {
    return (
      <div className={STYLES_FIXED_CONTAINER}>
        <div className={STYLES_FIXED_HEADER}>
          <UIHeaderDismiss onDismiss={this.props.onDismiss} />
        </div>
        <div className={STYLES_CONTAINER}>
          <UIListMediaInPlaylist
            media={this.props.media}
            onMediaSelect={this.props.onMediaSelect}
            onUserSelect={this.props.onUserSelect}
            mediaItems={this.props.playlist.mediaItems}
          />
        </div>
      </div>
    );
  }
}
