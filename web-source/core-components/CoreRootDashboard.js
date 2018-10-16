import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIListMediaInPlaylist from '~/core-components/reusable/UIListMediaInPlaylist';
import UIHeaderDismiss from '~/core-components/reusable/UIHeaderDismiss';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';
import UILink from '~/core-components/reusable/UILink';

const STYLES_CONTAINER = css`
  @keyframes dashboard-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: dashboard-animation 280ms ease;

  width: 420px;
  height: 100%;
  overflow-y: scroll;
  background ${Constants.colors.background};
  border-left: 1px solid ${Constants.colors.border};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

export default class CoreRootDashboard extends React.Component {
  render() {
    const data = this.props.storage.getItem('history');

    if (!data) {
      return (
        <div className={STYLES_CONTAINER}>
          <UIEmptyState title="History">
            As you play different Media using Castle, the last 10 links you visited will appear
            here.
          </UIEmptyState>
        </div>
      );
    }

    const { history } = JSON.parse(data);
    if (!history) {
      return (
        <div className={STYLES_CONTAINER}>
          <UIEmptyState title="History">We had an issue retrieving your history.</UIEmptyState>
        </div>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <UIEmptyState title="History">Here is a history of the media you have played.</UIEmptyState>
        <UIListMediaInPlaylist
          media={this.props.media}
          onMediaSelect={this.props.onMediaSelect}
          onUserSelect={this.props.onUserSelect}
          mediaItems={history}
        />
      </div>
    );
  }
}
