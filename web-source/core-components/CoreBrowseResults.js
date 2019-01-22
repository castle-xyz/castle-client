import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIButtonSecondary from '~/core-components/reusable/UIButtonSecondary';
import UIListMedia from '~/core-components/reusable/UIListMedia';
import UIListUsers from '~/core-components/reusable/UIListUsers';
import UIEmptyState from '~/core-components/reusable/UIEmptyState';
import UIGridMedia from '~/core-components/reusable/UIGridMedia';

import CoreWelcomeScreen from '~/core-components/CoreWelcomeScreen';

const STYLES_CONTAINER = css`
  @keyframes info-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: info-animation 280ms ease;

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

const STYLES_NO_RESULTS_FEATURED_MEDIA = css`
  padding: 16px 0 0 48px;
`;

export default class CoreBrowseResults extends React.Component {
  static defaultProps = {
    searchQuery: '',
    results: {
      media: [],
      users: [],
    },
  };

  _doesQueryLookLikeUrl = (query) => {
    return (
      query.endsWith('.lua') ||
      query.startsWith('castle:') ||
      query.startsWith('http')
    );
  };

  _renderEmptyMessage = () => {
    if (this.props.searchQuery && this._doesQueryLookLikeUrl(this.props.searchQuery)) {
      return (
        <div>
          <div style={{ marginBottom: 12 }}>
            We didn't find find anything matching <b>"{this.props.searchQuery}"</b>, but it looks
            like a game URL.
          </div>
          <UIButtonSecondary onClick={() => this.props.onLoadURL(this.props.searchQuery)}>
            Open <b>{this.props.searchQuery}</b>
          </UIButtonSecondary>
        </div>
      );
    } else {
      return (
        <span>
          We didn't find any games matching your search. If you're not sure what
          to play, try one of the following games...
        </span>
      );
    }
  };

  _isEmpty = () => {
    return (
      !this.props.results.media.length &&
      !this.props.results.users.length
    );
  };

  _renderEmpty = () => {
    return (
      <div className={STYLES_CONTAINER}>
        <UIEmptyState
          title="No media found"
          style={{ borderTop: `1px solid ${Constants.colors.border}` }}>
          {this._renderEmptyMessage()}
        </UIEmptyState>
        <div className={STYLES_NO_RESULTS_FEATURED_MEDIA}>
          <UIGridMedia
            mediaItems={this.props.featuredMedia}
            onMediaSelect={this.props.onMediaSelect}
          />
        </div>
      </div>
    );
  }

  _renderMedia = () => {
    if (this.props.results.media.length) {
      return (
        <UIListMedia
          mediaItems={this.props.results.media}
          onUserSelect={this.props.onUserSelect}
          onMediaSelect={this.props.onMediaSelect}
        />
      )
    }
    return null;
  };

  _renderUsers = () => {
    if (this.props.results.users.length) {
      return (
        <UIListUsers
          users={this.props.results.users}
          onUserSelect={this.props.onUserSelect}
        />
      );
    }
    return null;
  };

  render() {
    if (this.props.isPristine) {
      return (
        <div className={STYLES_CONTAINER}>
          <CoreWelcomeScreen
            onSelectRandom={this.props.onSelectRandom}
            onUserSelect={this.props.onUserSelect}
            onCreateProject={this.props.onCreateProject}
            onMediaSelect={this.props.onMediaSelect}
            onLoadHelp={this.props.onLoadHelp}
            featuredMedia={this.props.featuredMedia}
          />
        </div>
      );
    }

    if (this._isEmpty()) {
      return this._renderEmpty();
    } else {
      return (
        <div className={STYLES_CONTAINER}>
          {this._renderMedia()}
          {this._renderUsers()}
        </div>
      );
    }
  }
}
