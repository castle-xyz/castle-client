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
  background: ${Constants.colors.foreground};
`;

const STYLES_ROW = css`
  font-weight: 400;
  font-size: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid ${Constants.colors.border};
  cursor: pointer;
  overflow-wrap: break-word;
  word-wrap: break-word;

  :last-child {
    border-bottom: 0;
  }
`;

const STYLES_COLUMN_FULL = css`
  flex-shrink: 0;
  width: 100%;
  padding: 12px 16px 12px 16px;
  overflow-wrap: break-word;
  word-wrap: break-word;

  :hover {
    color: ${Constants.colors.selected};
  }
`;

const STYLES_COLUMN_NO_INTERACTION = css`
  flex-shrink: 0;
  width: 33.33%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  padding: 12px 16px 12px 16px;
`;

const STYLES_COLUMN = css`
  flex-shrink: 0;
  width: 33.33%;
  padding: 12px 16px 12px 16px;
  overflow-wrap: break-word;
  word-wrap: break-word;

  :hover {
    color: ${Constants.colors.selected};
  }
`;

export default class UIListMediaInPlaylist extends React.Component {
  render() {
    if (!this.props.mediaItems || !this.props.mediaItems.length) {
      return (
        <UIEmptyState title="Nothing here, yet">
          When this user uploads media you will be able to see it here.
        </UIEmptyState>
      );
    }

    return (
      <div className={STYLES_CONTAINER} style={this.props.style}>
        <div className={STYLES_ROW_TITLE}>
          <div className={STYLES_COLUMN_NO_INTERACTION}>Name/URL</div>
          <div className={STYLES_COLUMN_NO_INTERACTION}>Author</div>
          <div className={STYLES_COLUMN_NO_INTERACTION}>Published</div>
        </div>
        {this.props.mediaItems.map((m, i) => {
          const isSelected = this.props.media && this.props.media.mediaUrl === m.mediaUrl;

          // NOTE(jim): God help me.
          let username = null;
          let date = null;
          if (m.user) {
            username = m.user.username;
            date = m.createdTime;
          }

          if (m.extraData && m.extraData.itch && m.extraData.itch.itchUsername) {
            username = m.extraData.itch.itchUsername;
          }

          if (m.published) {
            date = m.published;
          }

          if (!username) {
            return (
              <div
                className={STYLES_ROW}
                style={isSelected ? { background: `#666` } : null}
                key={`playlist-list-item-${i}`}>
                <div className={STYLES_COLUMN_FULL} onClick={() => this.props.onMediaSelect(m)}>
                  {m.mediaUrl}
                </div>
              </div>
            );
          }

          return (
            <div
              className={STYLES_ROW}
              style={isSelected ? { background: `#666` } : null}
              key={`playlist-list-item-${i}`}>
              <div className={STYLES_COLUMN} onClick={() => this.props.onMediaSelect(m)}>
                {m.name}
              </div>
              <div className={STYLES_COLUMN} onClick={() => this.props.onUserSelect(m.user)}>
                {username}
              </div>
              <div className={STYLES_COLUMN_NO_INTERACTION}>
                {date ? Strings.toDate(date) : 'Unknown'}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
