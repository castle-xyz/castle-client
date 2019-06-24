import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigatorContext } from '~/contexts/NavigationContext';

import UIGameSet from '~/components/reusable/UIGameSet';
import UIPostList from '~/components/reusable/UIPostList';

const SCROLL_BOTTOM_OFFSET = 20;

const STYLES_HOME_CONTAINER = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_CONTENT_CONTAINER = css`
  margin-top: 16px;
  width: 100%;
`;

const STYLES_GAMES_CONTAINER = css`
  margin-bottom: 16px;
`;

const STYLES_POSTS_CONTAINER = css`
  margin-bottom: 24px;
`;

const STYLES_BOTTOM = css`
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_SECTION_TITLE = css`
  font-weight: 900;
  font-family: ${Constants.font.heading};
  font-size: ${Constants.typescale.lvl5};
  margin-bottom: 12px;
  margin-left: 24px;
`;

class GamesHomeScreen extends React.Component {
  static defaultProps = {
    posts: null,
    reloadPosts: () => {},
    loadMorePosts: () => {},
    trendingGames: [],
    gamesUnderConstruction: [],
    newestGames: [],
    randomGames: [],
  };

  state = {
    gamesToDisplay: [],
    isLoading: true,
  };

  componentDidMount() {
    this._mounted = true;
    const gamesToDisplay = this.props.trendingGames;
    this.setState({ gamesToDisplay: gamesToDisplay });
    this.props.reloadPosts();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.posts !== prevProps.posts && this.state.isLoading) {
      this.setState({ isLoading: false });
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  _handleScroll = (e) => {
    if (!this._mounted) return;

    // add 1000 so that as person scrolls at a reasonable browsing speed, things load before they get there
    const isBottom =
      e.target.scrollHeight - e.target.scrollTop <=
      e.target.clientHeight + SCROLL_BOTTOM_OFFSET + 1000;
    if (isBottom && !this.state.isLoading) {
      this.setState({ isLoading: true }, this.props.loadMorePosts);
    }
  };

  _navigateToGame = (game, options) => {
    return this.props.navigateToGame(game, { launchSource: `home-${this.props.mode}`, ...options });
  };

  _renderBottom = () => {
    let maybeLoading;
    if (this.state.isLoading) {
      maybeLoading = <div>Loading...</div>;
    }
    return <div className={STYLES_BOTTOM}>{maybeLoading}</div>;
  };

  render() {
    const { posts } = this.props;
    let maybePostList;
    if (posts) {
      maybePostList = (
        <UIPostList
          posts={posts}
          onUserSelect={this.props.navigateToUserProfile}
          onGameSelect={this._navigateToGame}
        />
      );
    }
    return (
      <div className={STYLES_HOME_CONTAINER} onScroll={this._handleScroll}>
        <div className={STYLES_CONTENT_CONTAINER}>
          <div className={STYLES_GAMES_CONTAINER}>
            <div className={STYLES_SECTION_TITLE}>Games</div>
            <UIGameSet
              title=""
              numRowsToElide={3}
              viewer={this.props.viewer}
              gameItems={this.state.gamesToDisplay}
              onUserSelect={this.props.navigateToUserProfile}
              onGameSelect={this._navigateToGame}
              onSignInSelect={this.props.navigateToSignIn}
            />
          </div>
          <div className={STYLES_POSTS_CONTAINER}>
            <div className={STYLES_SECTION_TITLE}>Posts</div>
            {maybePostList}
          </div>
        </div>
        {this._renderBottom()}
      </div>
    );
  }
}

export default class GamesHomeScreenWithContext extends React.Component {
  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <CurrentUserContext.Consumer>
            {(currentUser) => (
              <GamesHomeScreen
                viewer={currentUser ? currentUser.user : null}
                navigateToUserProfile={navigator.navigateToUserProfile}
                navigateToGame={navigator.navigateToGame}
                navigateToGameUrl={navigator.navigateToGameUrl}
                navigateToSignIn={navigator.navigateToSignIn}
                posts={currentUser.content.posts}
                reloadPosts={currentUser.reloadPosts}
                loadMorePosts={currentUser.loadMorePosts}
                {...this.props}
              />
            )}
          </CurrentUserContext.Consumer>
        )}
      </NavigatorContext.Consumer>
    );
  }
}
