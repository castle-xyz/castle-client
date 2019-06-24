import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigatorContext } from '~/contexts/NavigationContext';

import GamesHomeScreen from '~/screens/GamesHomeScreen';
import UIGameGrid from '~/components/reusable/UIGameGrid';
import UIGameSet from '~/components/reusable/UIGameSet';

const STYLES_CONTAINER = css`
  background: ${Constants.colors.white};
  box-shadow: inset 1px 0 2px -1px rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_SECTION_TITLE = css`
  font-weight: 900;
  font-family: ${Constants.font.heading};
  font-size: ${Constants.typescale.lvl5};
  margin-bottom: 16px;
  margin-left: 24px;
`;

const STYLES_HISTORY_CONTENT = css`
  margin: 16px 0px 0px 0px;
`;

class HomeScreen extends React.Component {
  static defaultProps = {
    trendingGames: [],
    gamesUnderConstruction: [],
    newestGames: [],
    randomGames: [],
    featuredExamples: [],
    history: [],
    refreshHistory: async () => {},
  };

  state = {
    gameInfoToShow: null,
  };

  componentDidMount() {
    this.props.refreshHistory();
  }

  _navigateToGame = (game, options) => {
    return this.props.navigateToGame(game, { launchSource: `home-${this.props.mode}`, ...options });
  };

  render() {
    const { mode } = this.props;
    const recentGames = this.props.history
      ? this.props.history.map((historyItem) => {
          return { ...historyItem.game, key: historyItem.userStatusId };
        })
      : [];

    return (
      <div className={STYLES_CONTAINER}>
        {mode === 'posts' ? (
          <UIPostList
            viewer={this.props.viewer}
            onUserSelect={this.props.navigateToUserProfile}
            onGameSelect={this._navigateToGame}
            onSignInSelect={this.props.navigateToSignIn}
          />
        ) : null}
        {mode === 'home' ? <GamesHomeScreen {...this.props} /> : null}
        {mode === 'examples' ? (
          <UIGameGrid
            viewer={this.props.viewer}
            gameItems={this.props.featuredExamples}
            onUserSelect={this.props.navigateToUserProfile}
            onGameSelect={this._navigateToGame}
            onSignInSelect={this.props.navigateToSignIn}
          />
        ) : null}
        {mode === 'history' ? (
          <div className={STYLES_HISTORY_CONTENT}>
            <div className={STYLES_SECTION_TITLE}>History</div>
            <UIGameSet
              viewer={this.props.viewer}
              gameItems={recentGames}
              onUserSelect={this.props.navigateToUserProfile}
              onGameSelect={this._navigateToGame}
              onSignInSelect={this.props.navigateToSignIn}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

export default class HomeScreenWithContext extends React.Component {
  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <CurrentUserContext.Consumer>
            {(currentUser) => (
              <HomeScreen
                viewer={currentUser ? currentUser.user : null}
                navigateToUserProfile={navigator.navigateToUserProfile}
                navigateToGame={navigator.navigateToGame}
                navigateToSignIn={navigator.navigateToSignIn}
                history={currentUser.userStatusHistory}
                refreshHistory={currentUser.refreshCurrentUser}
                {...this.props}
              />
            )}
          </CurrentUserContext.Consumer>
        )}
      </NavigatorContext.Consumer>
    );
  }
}
