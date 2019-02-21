import * as React from 'react';
import { css } from 'react-emotion';

import * as Constants from '~/common/constants';
import { NavigatorContext } from '~/contexts/NavigationContext';
import * as Strings from '~/common/strings';
import UIButtonSecondary from '~/components/reusable/UIButtonSecondary';
import UIGameGrid from '~/components/reusable/UIGameGrid';
import UIHeading from '~/components/reusable/UIHeading';
import UIUserGrid from '~/components/reusable/UIUserGrid';
import * as Urls from '~/common/urls';

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;
  display: flex;
  background: ${Constants.colors.white};
  flex-direction: column;
`;

const STYLES_SECTION = css`
  padding: 16px 16px 32px 16px;
`;

export default class SearchScreen extends React.Component {
  static contextType = NavigatorContext;
  static defaultProps = {
    allContent: {
      games: [],
      users: [],
    },
  };
  state = {
    results: {
      games: [],
      users: [],
    },
  };

  componentDidUpdate(prevProps, prevState) {
    const oldQuery = prevProps && prevProps.query ? prevProps.query : null;
    const newQuery = this.props.query;
    if (oldQuery !== newQuery) {
      this._updateResults();
    }
  }

  _updateResults = () => {
    if (Strings.isEmpty(this.props.query)) {
      this.setState({
        results: {
          games: [],
          users: [],
        },
      });
    } else {
      this.setState({
        results: {
          games: this.props.allContent.games.filter(this._filterGameWithSearchState),
          users: this.props.allContent.users.filter(this._filterUserWithSearchState),
        },
      });
    }
  };

  _stringAsSearchInvariant = (s) => {
    return s.toLowerCase().trim();
  };

  _stringIncludesSearchQuery = (s, query) => {
    if (Strings.isEmpty(s)) {
      return false;
    }

    return this._stringAsSearchInvariant(s).includes(query);
  };

  _filterGameWithSearchState = (m) => {
    if (!m) {
      return false;
    }
    const query = this._stringAsSearchInvariant(this.props.query);
    if (this._stringIncludesSearchQuery(m.name, query)) {
      return true;
    }

    if (Strings.isEmpty(m.name) && this._stringIncludesSearchQuery(m.url, query)) {
      return true;
    }

    if (m.user) {
      if (this._stringIncludesSearchQuery(m.user.name, query)) {
        return true;
      }
      if (this._stringIncludesSearchQuery(m.user.username, query)) {
        return true;
      }
    }

    return false;
  };

  _filterUserWithSearchState = (u) => {
    if (!u) {
      return false;
    }
    const query = this._stringAsSearchInvariant(this.props.query);
    if (this._stringIncludesSearchQuery(u.name, query)) {
      return true;
    }
    if (this._stringIncludesSearchQuery(u.username, query)) {
      return true;
    }
    return false;
  };

  _maybeNavigateToUrl = (url) => {
    try {
      url = url.slice(0).trim();
      if (Urls.isPrivateUrl(url)) {
        url = url.replace('castle://', 'http://');
      }
    } catch (_) {}
    if (Strings.isEmpty(url)) {
      return;
    }

    this.context.navigateToGameUrl(url);
    this.props.onSearchReset();
  };

  _navigateToGame = async (game) => {
    await this.context.navigateToGame(game);
    this.props.onSearchReset();
  };

  _navigateToUserProfile = async (user) => {
    await this.context.navigateToUserProfile(user);
    this.props.onSearchReset();
  };

  _doesQueryLookLikeUrl = (query) => {
    query = query.slice(0).trim();
    return (
      query.endsWith('.lua') ||
      query.startsWith('castle:') ||
      query.startsWith('http') ||
      query.startsWith('file://')
    );
  };

  _renderNoResults = () => {
    if (this.props.query && this._doesQueryLookLikeUrl(this.props.query)) {
      return (
        <div className={STYLES_SECTION}>
          <UIHeading>No results</UIHeading>
          <div style={{ marginBottom: 12 }}>
            We didn't find find anything matching <b>"{this.props.query}"</b>, but it looks like a
            game URL.
          </div>
          <UIButtonSecondary onClick={() => this._maybeNavigateToUrl(this.props.query)}>
            Open <b>{this.props.query}</b>
          </UIButtonSecondary>
        </div>
      );
    } else {
      return (
        <div className={STYLES_SECTION}>
          <UIHeading>No results</UIHeading>
          <div>
            We didn't find find anything matching <b>"{this.props.query}"</b>.
          </div>
        </div>
      );
    }
  };

  _renderGameResults = () => {
    return (
      <div className={STYLES_SECTION}>
        <UIHeading>Games</UIHeading>
        <UIGameGrid
          gameItems={this.state.results.games}
          onUserSelect={this._navigateToUserProfile}
          onGameSelect={this._navigateToGame}
        />
      </div>
    );
  };

  _renderUserResults = () => {
    return (
      <div className={STYLES_SECTION}>
        <UIHeading>Users</UIHeading>
        <UIUserGrid users={this.state.results.users} onUserSelect={this._navigateToUserProfile} />
      </div>
    );
  };

  render() {
    let maybeGameResults, maybeUserResults, maybeNoResults;
    if (this.state.results.games && this.state.results.games.length) {
      maybeGameResults = this._renderGameResults();
    }
    if (this.state.results.users && this.state.results.users.length) {
      maybeUserResults = this._renderUserResults();
    }
    if (!maybeGameResults && !maybeUserResults) {
      maybeNoResults = this._renderNoResults();
    }
    return (
      <div className={STYLES_CONTAINER}>
        {maybeGameResults}
        {maybeUserResults}
        {maybeNoResults}
      </div>
    );
  }
}
