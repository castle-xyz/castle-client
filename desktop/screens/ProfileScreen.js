import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';

import UIHorizontalNavigation from '~/components/reusable/UIHorizontalNavigation';
import UIEmptyState from '~/components/reusable/UIEmptyState';

import EditProfile from '~/components/profile/EditProfile';
import AddGame from '~/components/profile/AddGame';
import ProfileHeader from '~/components/profile/ProfileHeader';
import ProfileSettings from '~/components/profile/ProfileSettings';
import SignOut from '~/components/profile/SignOut';
import UIGameSet from '~/components/reusable/UIGameSet';

const STYLES_CONTAINER = css`
  color: ${Constants.colors.text};
  background: ${Constants.colors.background};
  width: 100%;
  min-width: 25%;
  height: 100%;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_GAME_GRID = css`
  marigin-left: 24px;
`;

class ProfileScreen extends React.Component {
  static defaultProps = {
    creator: null,
    viewer: null,
    onAfterSave: () => {},
    navigateToGame: async (game) => {},
    navigateToGameUrl: async (url) => {},
    navigateToUserProfile: (user) => {},
  };

  state = {
    mode: this.props.options.mode ? this.props.options.mode : 'games',
    gameToUpdate: null, // if mode === 'update-game'
  };

  componentWillReceiveProps(nextProps) {
    const existingUserId =
      this.props.creator && this.props.creator.userId ? this.props.creator.userId : null;
    const nextUserId =
      nextProps.creator && nextProps.creator.userId ? nextProps.creator.userId : null;

    if (nextUserId != existingUserId) {
      // we're rendering a new profile, reset state.
      this._onShowGames();
    } else {
      // if updating a game, pass down any new updates to that game.
      if (this.state.gameToUpdate) {
        if (nextProps.creator && nextProps.creator.gameItems) {
          for (let ii = 0, nn = nextProps.creator.gameItems.length; ii < nn; ii++) {
            const game = nextProps.creator.gameItems[ii];
            if (game.gameId === this.state.gameToUpdate.gameId) {
              this.setState({ gameToUpdate: game });
              break;
            }
          }
        }
      }
    }

    if (nextProps.options && nextProps.options.mode) {
      this.setState({ mode: nextProps.options.mode });
    }
  }

  _onShowGames = () => this.setState({ mode: 'games', gameToUpdate: null });
  _onShowAddGame = () => this.setState({ mode: 'add-game' });
  _onShowEditProfile = () => this.setState({ mode: 'edit-profile' });
  _onShowSettings = () => this.setState({ mode: 'settings' });
  _onShowUpdateGame = (game) => this.setState({ mode: 'update-game', gameToUpdate: game });

  _onAfterAddGame = () => {
    // after adding a game, back out to the full list of games
    this._onShowGames();
    this.props.onAfterSave();
  };

  _getNavigationItems = (isOwnProfile) => {
    let navigationItems = [{ label: 'Games', key: 'games' }];

    if (isOwnProfile) {
      navigationItems.push({ label: 'Add game', key: 'add-game' });
      navigationItems.push({ label: 'Edit Profile', key: 'edit-profile' });
      navigationItems.push({ label: 'Settings', key: 'settings' });
    }

    return navigationItems;
  };

  _onNavigationChange = (selectedKey) => {
    const callbacks = {
      games: this._onShowGames,
      'add-game': this._onShowAddGame,
      'edit-profile': this._onShowEditProfile,
      settings: this._onShowSettings,
    };

    if (callbacks.hasOwnProperty(selectedKey)) {
      callbacks[selectedKey]();
    }
  };

  _navigateToGame = async (game, options) => {
    await this.props.navigateToGame(game, { ...options, launchSource: 'profile' });
  };

  _renderGameContent = (isOwnProfile, viewer, creator) => {
    return creator.gameItems && creator.gameItems.length ? (
      <div className={STYLES_GAME_GRID}>
        <UIGameSet
          viewer={this.props.viewer}
          gameItems={creator.gameItems}
          onUserSelect={this.props.navigateToUserProfile}
          onGameSelect={this._navigateToGame}
          onSignInSelect={this.props.navigateToSignIn}
        />
      </div>
    ) : (
      <UIEmptyState title="No games yet">
        {isOwnProfile
          ? 'You have not added any games to your profile yet.'
          : 'This user has not added any games to their profile yet.'}
      </UIEmptyState>
    );
  };

  _renderAddGame = (isOwnProfile) => {
    if (!isOwnProfile) return null;

    return <AddGame onAfterSave={this._onAfterAddGame} />;
  };

  _renderUpdateGame = (game) => {
    return <AddGame game={this.state.gameToUpdate} onAfterSave={this._onAfterAddGame} />;
  };

  _renderEditProfileContent = (isOwnProfile, user) => {
    if (!isOwnProfile) return null;

    return <EditProfile user={user} onAfterSave={this.props.onAfterSave} />;
  };

  _renderSettings = (isOwnProfile, user) => {
    if (!isOwnProfile) return null;

    return <ProfileSettings user={user} onShowSettings={this._onShowSettings} />;
  };

  _renderSignOutContent = (isOwnProfile) => {
    if (!isOwnProfile) return null;
    return <SignOut onSignOut={this.props.onSignOut} />;
  };

  render() {
    const { viewer, creator } = this.props;
    const isOwnProfile = viewer && viewer.userId == creator.userId;

    let profileContentElement;
    const { mode } = this.state;

    if (mode === 'edit-profile') {
      profileContentElement = this._renderEditProfileContent(isOwnProfile, viewer);
    } else if (mode === 'add-game') {
      profileContentElement = this._renderAddGame(isOwnProfile);
    } else if (mode === 'update-game') {
      profileContentElement = this._renderUpdateGame(this.state.gameToUpdate);
    } else if (mode === 'settings') {
      profileContentElement = this._renderSettings(isOwnProfile, viewer);
    } else {
      profileContentElement = this._renderGameContent(isOwnProfile, viewer, creator);
    }

    return (
      <div className={STYLES_CONTAINER}>
        <ProfileHeader
          creator={creator}
          isOwnProfile={isOwnProfile}
          navigateToGameUrl={this.props.navigateToGameUrl}
        />
        <UIHorizontalNavigation
          items={this._getNavigationItems(isOwnProfile)}
          selectedKey={this.state.mode}
          onChange={this._onNavigationChange}
        />
        {profileContentElement}
      </div>
    );
  }
}

export default class ProfileScreenWithContext extends React.Component {
  _renderProfile = (navigator, navigation, currentUser) => {
    return (
      <ProfileScreen
        navigateToGame={navigator.navigateToGame}
        navigateToGameUrl={navigator.navigateToGameUrl}
        navigateToUserProfile={navigator.navigateToUserProfile}
        navigateToSignIn={navigator.navigateToSignIn}
        viewer={currentUser.user}
        creator={navigation.userProfileShown}
        options={navigation.options ? navigation.options : { mode: 'games' }}
        onSignOut={currentUser.clearCurrentUser}
        onAfterSave={currentUser.refreshCurrentUser}
      />
    );
  };

  render() {
    return (
      <NavigatorContext.Consumer>
        {(navigator) => (
          <NavigationContext.Consumer>
            {(navigation) => (
              <CurrentUserContext.Consumer>
                {(currentUser) => this._renderProfile(navigator, navigation, currentUser)}
              </CurrentUserContext.Consumer>
            )}
          </NavigationContext.Consumer>
        )}
      </NavigatorContext.Consumer>
    );
  }
}
