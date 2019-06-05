import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as Urls from '~/common/urls';

import { css } from 'react-emotion';
import { DevelopmentSetterContext } from '~/contexts/DevelopmentContext';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';

import CreateProjectScreen from '~/screens/CreateProjectScreen';
import GameWindow from '~/native/gamewindow';
import ChatScreen from '~/screens/ChatScreen';
import GameScreen from '~/screens/GameScreen';
import HomeScreen from '~/screens/HomeScreen';
import ProfileScreen from '~/screens/ProfileScreen';
import NotificationScreen from '~/screens/NotificationScreen';
import SearchScreen from '~/screens/SearchScreen';
import ContentNavigationBar from '~/components/ContentNavigationBar';
import NowPlayingBar from '~/components/NowPlayingBar';
import EditPostScreen from '~/screens/EditPostScreen';
import SignInScreen from '~/screens/SignInScreen';

const STYLES_CONTAINER_FLUID = css`
  font-family: ${Constants.font.default};
  background: ${Constants.colors.default};
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const STYLES_CONTAINER_FIXED_WITH_BORDER = css`
  width: 480px;
  flex-shrink: 0;
`;

class ContentContainer extends React.Component {
  static defaultProps = {
    mode: 'home',
    setIsDeveloping: () => {},
  };

  state = {
    searchQuery: '',
    isAddingGame: false,
  };

  componentDidUpdate(prevProps) {
    if (
      this.props.mode === 'game' &&
      this.props.timeGameLoaded !== prevProps.timeGameLoaded &&
      this.props.game
    ) {
      // if we loaded a new game, auto-show logs for local urls
      const isLocal = Urls.isPrivateUrl(this.props.game.url);
      this.props.setIsDeveloping(isLocal, { onlyEnable: true });
    }
  }

  _handleSearchReset = () => {
    this.setState({
      searchQuery: '',
    });
  };

  _handleSearchChange = async (e) => {
    this.setState(
      {
        searchQuery: e.target.value,
      },
      () => {
        if (Strings.isEmpty(this.state.searchQuery)) {
          return this._handleSearchReset();
        }
      }
    );
  };

  _handleSearchSubmit = async (e) => {
    const isCandidate = Strings.isMaybeCastleURL(e.target.value);

    if (!isCandidate) {
      return this._handleSearchChange(e);
    }

    let url = e.target.value;
    try {
      url = url.slice(0).trim();
      if (Urls.isPrivateUrl(url)) {
        url = url.replace('castle://', 'http://');
      }
    } catch (_) {
      //
    }

    this.props.navigator.navigateToGameUrl(url, { launchSource: 'search' });
    this._handleSearchReset();
  };

  _renderContent = (mode) => {
    if (mode === 'game') {
      return <GameScreen isFullScreen={this.props.isFullScreen} />;
    } else if (
      mode === 'home' ||
      mode === 'featured' ||
      mode === 'history' ||
      mode === 'posts'
    ) {
      return (
        <HomeScreen
          featuredGames={this.props.featuredGames}
          featuredExamples={this.props.featuredExamples}
          timeLastNavigated={this.props.timeLastNavigated}
          mode={mode}
        />
      );
    } else if (mode === 'chat') {
      return <ChatScreen />;
    } else if (mode === 'create') {
      return <CreateProjectScreen templates={this.props.featuredExamples} />;
    } else if (mode === 'profile') {
      return <ProfileScreen />;
    } else if (mode === 'notifications') {
      return <NotificationScreen />;
    } else if (mode === 'edit_post') {
      return <EditPostScreen />;
    } else if (mode === 'signin') {
      return <SignInScreen navigator={this.props.navigator} />;
    }
  };

  _renderSearch = () => {
    return (
      <SearchScreen
        query={this.state.searchQuery}
        onSearchReset={this._handleSearchReset}
        viewer={this.props.viewer}
      />
    );
  };

  render() {
    let contentElement;
    if (Strings.isEmpty(this.state.searchQuery)) {
      contentElement = this._renderContent(this.props.mode);
    } else {
      contentElement = this._renderSearch();
    }

    let nowPlayingElement;
    if (this.props.game && this.props.mode !== 'game') {
      nowPlayingElement = <NowPlayingBar game={this.props.game} navigator={this.props.navigator} />;
    }

    return (
      <div className={STYLES_CONTAINER_FLUID}>
        {this.props.mode === 'profile' ||
        this.props.mode === 'home' ||
        this.props.mode === 'create' ||
        this.props.mode === 'featured' ||
        this.props.mode === 'history' ||
        this.props.mode === 'posts' ? (
          <ContentNavigationBar
            searchQuery={this.state.searchQuery}
            onSearchReset={this._handleSearchReset}
            onSearchChange={this._handleSearchChange}
            onSearchSubmit={this._handleSearchSubmit}
            mode={this.props.mode}
          />
        ) : null}
        {contentElement}
        {nowPlayingElement}
      </div>
    );
  }
}

export default class ContentContainerWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => (
          <DevelopmentSetterContext.Consumer>
            {(development) => (
              <NavigationContext.Consumer>
                {(navigation) => {
                  return (
                    <NavigatorContext.Consumer>
                      {(navigator) => (
                        <ContentContainer
                          viewer={currentUser ? currentUser.user : null}
                          mode={navigation.contentMode}
                          timeGameLoaded={navigation.timeGameLoaded}
                          timeLastNavigated={navigation.timeLastNavigated}
                          game={navigation.game}
                          navigator={navigator}
                          setIsDeveloping={development.setIsDeveloping}
                          {...this.props}
                        />
                      )}
                    </NavigatorContext.Consumer>
                  );
                }}
              </NavigationContext.Consumer>
            )}
          </DevelopmentSetterContext.Consumer>
        )}
      </CurrentUserContext.Consumer>
    );
  }
}
