import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/core-components/primitives/svg';

import { css } from 'react-emotion';

import UIListMedia from '~/core-components/reusable/UIListMedia';
import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';
import UICardMedia from '~/core-components/reusable/UICardMedia';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';
import UILink from '~/core-components/reusable/UILink';

const STYLES_FIXED_CONTAINER = css`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 48px 0 48px 0;
`;

const STYLES_FIXED_HEADER = css`
  background: ${Constants.colors.background};
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
`;

const STYLES_FIXED_FOOTER = css`
  background: ${Constants.colors.background};
  color: ${Constants.colors.white};
  border-top: 1px solid ${Constants.colors.border};
  height: 48px;
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  padding-left: 16px;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_MIDDLE = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 25%;
  width: 100%;
  height: 100%;
`;

const STYLES_RIGHT = css`
  flex-shrink: 0;
  padding-right: 16px;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background ${Constants.colors.background};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_ACTION = css`
  margin-top: 8px;
  padding: 0 16px 0 16px;
`;

const STYLES_ACTION_ITEM = css`
  margin-top: 8px;
`;

export default class CoreRootContextSidebar extends React.Component {
  _reference;

  getRef = () => {
    return this._reference;
  };

  _renderEmpty = () => {
    const browseIcon = (<SVG.Search height="16px" />);
    return (
      <div
        className={STYLES_FIXED_CONTAINER}
        ref={c => {
          this._reference = c;
        }}>
        <div className={STYLES_CONTAINER}>
          <UIEmptyState title="No media loaded">
            You aren't playing anything at the moment. Want to get started with Castle?
          </UIEmptyState>
          <div className={STYLES_ACTION}>
            <div className={STYLES_ACTION_ITEM}>
              <UIButtonIconHorizontal
                onClick={this.props.onToggleBrowse}
                icon={browseIcon}>
                Browse media
              </UIButtonIconHorizontal>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.media) {
      return this._renderEmpty();
    }

    return (
      <div
        className={STYLES_FIXED_CONTAINER}
        ref={c => {
          this._reference = c;
        }}>
        <div className={STYLES_CONTAINER}>
          <UIEmptyState title="Now playing" />
          <UICardMedia
            viewer={this.props.viewer}
            media={this.props.media}
            onUserSelect={this.props.onUserSelect}
            onToggleProfile={this.props.onToggleProfile}
            onRefreshViewer={this.props.onRefreshViewer}
            onNavigateToBrowserPage={this.props.onNavigateToBrowserPage}
            />
        </div>
      </div>
    );
  }
}
