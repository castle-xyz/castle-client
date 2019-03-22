import * as React from 'react';
import * as Constants from '~/common/constants';
import { css } from 'react-emotion';

import HomeMakeBanner from '~/components/home/HomeMakeBanner';
import HomeUpdateBanner from '~/components/home/HomeUpdateBanner';
import UIGameGrid from '~/components/reusable/UIGameGrid';
import UIHeading from '~/components/reusable/UIHeading';
import UIHorizontalNavigation from '~/components/reusable/UIHorizontalNavigation';

import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigatorContext } from '~/contexts/NavigationContext';

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;
  background: ${Constants.colors.background};
  overflow-y: scroll;
  padding-bottom: 64px;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

class HomeScreen extends React.Component {
  static defaultProps = {
    featuredGames: [],
    history: [],
    refreshHistory: async () => {},
  };

  state = {
    mode: 'games', // history | games
  };

  _container;

  componentDidMount() {
    this.props.refreshHistory();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.timeLastNavigated !== this.props.timeLastNavigated &&
      this.state.mode !== 'games'
    ) {
      this._setModeAndScrollToTop('games');
    }
  }

  _getNavigationItems = () => {
    const navigationItems = [];
    navigationItems.push({ label: 'Featured games', key: 'games' });
    navigationItems.push({ label: 'Last played', key: 'history' });

    return navigationItems;
  };

  _handleNavigationChange = (selectedKey) => {
    this.setState({ mode: selectedKey });
  };

  _setModeAndScrollToTop = (mode) => {
    this.setState({ mode: mode }, () => {
      if (this._container) {
        this._container.scroll({ top: 0 });
      }
    });
  };

  render() {
    const recentGames = this.props.history
      ? this.props.history.map((historyItem) => {
          return { ...historyItem.game, key: historyItem.userStatusId };
        })
      : null;

    return (
      <div
        className={STYLES_CONTAINER}
        ref={(r) => {
          this._container = r;
        }}>
        <UIHorizontalNavigation
          items={this._getNavigationItems()}
          selectedKey={this.state.mode}
          onChange={this._handleNavigationChange}
        />
        {this.state.mode === 'games' ? (
          <div>
            <UIGameGrid
              gameItems={this.props.featuredGames}
              onUserSelect={this.props.navigateToUserProfile}
              onGameSelect={this.props.navigateToGame}
            />
          </div>
        ) : null}
        {this.state.mode === 'history' ? (
          <div>
            <UIGameGrid
              gameItems={recentGames}
              onUserSelect={this.props.navigateToUserProfile}
              onGameSelect={this.props.navigateToGame}
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
                navigateToUserProfile={navigator.navigateToUserProfile}
                navigateToGame={navigator.navigateToGame}
                navigateToGameUrl={navigator.navigateToGameUrl}
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
