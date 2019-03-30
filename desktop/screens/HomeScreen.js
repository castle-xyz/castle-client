import * as React from 'react';
import * as Constants from '~/common/constants';
import { css } from 'react-emotion';

import UIGameGrid from '~/components/reusable/UIGameGrid';
import UIFeed from '~/components/reusable/UIFeed';
import UIHeading from '~/components/reusable/UIHeading';
import UIHorizontalNavigation from '~/components/reusable/UIHorizontalNavigation';

import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigatorContext } from '~/contexts/NavigationContext';

import HomeUpdateBanner from '~/components/home/HomeUpdateBanner';

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
    // TODO: real data for postItems
    postItems: [
      { 
        key: 1,
        postId: 1,
        owner: "Jimacat",
        text: "Just hangin with some dogs in the Jardin",
        gameId: "Jardins Du Standoff",
        timestamp: "5 min ago",
        primaryColor: "#88ff88",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 2,
        postId: 2,
        owner: "Trasevol Dog",
        text: "The BotJuice Logo is done and I'm really happy about it :D",
        gameId: "Bot Juice",
        timestamp: "7d ago",
        primaryColor: "#8888ff",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 3,
        postId: 3,
        owner: "Castle Historian",
        text: "@Trasevol_Dog, @spaceling & 12 others played a game of Jardins Du Standoff",
        gameId: "Jardins Du Standoff",
        timestamp: "3d ago",
        primaryColor: "#88ff88",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 4,
        postId: 4,
        owner: "Liquidream",
        text: "The Ballz Are Lava is OFFICIALLY RELEASED!!! Let's see which ball-dodgin master can top the leaderboard.",
        gameId: "The Ballz Are Lava",
        timestamp: "3 min ago",
        primaryColor: "#ff8888",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 5,
        postId: 5,
        owner: "nikki93",
        text: "Flaggr competitors are now displayed as their castle avatars!1 :D :D:D cc @schazers :D",
        gameId: "Flaggr",
        timestamp: "1 week ago",
        primaryColor: "#ffff88",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 6,
        postId: 6,
        owner: "ccheever",
        text: "You may have made the game @terribleben, but you don't play it 11 times daily",
        gameId: "Runabout",
        timestamp: "Just now",
        primaryColor: "#e5d5a0",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 7,
        postId: 7,
        owner: "Castle Team",
        text: "Version 1.5.9 of Castle is released, featuring a brand new social feed! See here for more info: medium.com/",
        gameId: "Castle",
        timestamp: "2 weeks ago",
        primaryColor: "#ffff00",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 8,
        postId: 8,
        owner: "schazers",
        text: "Can anyone help me figure out why these circles are behaving like this? Halp! eyes eyes eyes",
        gameId: "Robosquash",
        timestamp: "4 weeks ago",
        primaryColor: "#c990bc",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "",
      },
      { 
        key: 9,
        postId: 9,
        owner: "terribleben",
        text: "I think I made this part too hard... What do you think? (Click to play the hard part.)",
        gameId: "Runabout",
        timestamp: "9 days ago",
        primaryColor: "#e5d5a0",
        media: "https://i.imgur.com/35jkA9Q.png",
        json: "State for the hard part of runabout",
      },
    ],
    featuredExamples: [],
    history: [],
    refreshHistory: async () => {},
  };

  state = {
    mode: 'posts',
  };

  _container;

  componentDidMount() {
    this.props.refreshHistory();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.timeLastNavigated !== this.props.timeLastNavigated &&
      this.state.mode !== 'posts'
    ) {
      this._setModeAndScrollToTop('posts');
    }
  }

  _getNavigationItems = () => {
    const navigationItems = [];
    navigationItems.push({ label: 'Activity', key: 'posts' });
    navigationItems.push({ label: 'Featured games', key: 'games' });
    navigationItems.push({ label: 'Learning examples', key: 'examples' });
    navigationItems.push({ label: 'Your history', key: 'history' });

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
        {this.state.mode === 'posts' ? (
          <UIFeed
            viewer={this.props.viewer}
            postItems={this.props.postItems}
            onUserSelect={this.props.navigateToUserProfile}
            onGameSelect={this.props.navigateToGame}
            onSignInSelect={this.props.navigateToSignIn}
          />
        ) : null}
        {this.state.mode === 'games' ? (
          <UIGameGrid
            viewer={this.props.viewer}
            gameItems={this.props.featuredGames}
            onUserSelect={this.props.navigateToUserProfile}
            onGameSelect={this.props.navigateToGame}
            onSignInSelect={this.props.navigateToSignIn}
          />
        ) : null}
        {this.state.mode === 'examples' ? (
          <UIGameGrid
            viewer={this.props.viewer}
            gameItems={this.props.featuredExamples}
            onUserSelect={this.props.navigateToUserProfile}
            onGameSelect={this.props.navigateToGame}
            onSignInSelect={this.props.navigateToSignIn}
          />
        ) : null}
        {this.state.mode === 'history' ? (
          <UIGameGrid
            gameItems={recentGames}
            viewer={this.props.viewer}
            onUserSelect={this.props.navigateToUserProfile}
            onGameSelect={this.props.navigateToGame}
            onSignInSelect={this.props.navigateToSignIn}
          />
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
                navigateToGameUrl={navigator.navigateToGameUrl}
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
