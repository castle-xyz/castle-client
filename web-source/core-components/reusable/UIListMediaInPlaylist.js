import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIEmptyState from '~/core-components/reusable/UIEmptyState';

const STYLES_CONTAINER = css`
  padding: 0 0 88px 0;
  color: ${Constants.colors.white};
`;

const STYLES_ROW_TITLE = css`
  font-weight: 400;
  font-size: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: #222;
  border-bottom: 1px solid ${Constants.colors.white10};
`;

const STYLES_ROW = css`
  font-weight: 400;
  font-size: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid ${Constants.colors.white10};
  cursor: pointer;

  :last-child {
    border-bottom: 0;
  }
`;

const STYLES_ROW_SELECTED = css`
  font-weight: 400;
  font-size: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid ${Constants.colors.white10};
  cursor: pointer;
  background: ${Constants.colors.green};

  :last-child {
    border-bottom: 0;
  }
`;

const STYLES_COLUMN = css`
  flex-shrink: 0;
  width: 33.33%;
  padding: 12px 16px 12px 16px;
`;

const STYLES_FLUID_COLUMN = css`
  min-width: 25%;
  width: 100%;
  padding: 12px 16px 12px 16px;
`;

export default class UIListMediaInPlaylist extends React.Component {
  render() {
    if (!this.props.mediaItems.length) {
      return (
        <UIEmptyState title="Nothing here, yet">
          When this user uploads media you will be able to see it here.
        </UIEmptyState>
      );
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_ROW_TITLE}>
          <div className={STYLES_COLUMN}>Name</div>
          <div className={STYLES_COLUMN}>Author</div>
          <div className={STYLES_COLUMN}>Published</div>
        </div>
        {this.props.mediaItems.map((m, i) => {
          const isSelected = this.props.media && this.props.media.mediaId === m.mediaId;

          let username = null;
          if (m.user) {
            username = m.user.username;
          }

          // TODO(jim): Consolidate this when we properly have usernames
          return (
            <div
              className={isSelected ? STYLES_ROW_SELECTED : STYLES_ROW}
              key={`playlist-list-item-${i}`}
              onClick={() => this.props.onMediaSelect(m)}>
              <div className={STYLES_COLUMN} style={{ fontWeight: 600 }}>
                {m.name}
              </div>
              <div
                className={STYLES_COLUMN}
                style={{
                  fontWeight: username ? 600 : 400,
                  color: username ? null : '#666',
                }}>
                {username ? username : '-'}
              </div>
              <div className={STYLES_COLUMN}>{Strings.toDate(m.published)}</div>
            </div>
          );
        })}
      </div>
    );
  }
}
