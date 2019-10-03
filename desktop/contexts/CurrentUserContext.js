import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Utilities from '~/common/utilities';

import { UserPresenceContext } from '~/contexts/UserPresenceContext';

const EMPTY_CURRENT_USER = {
  user: null,
  settings: {
    notifications: null,
  },
  timeLastLoaded: 0,
  userStatusHistory: [],
  content: {
    posts: null,
    allGames: null,
    trendingGames: null,
    multiplayerSessions: null,
  },
  appNotifications: [],
};

const CurrentUserContextDefaults = {
  ...EMPTY_CURRENT_USER,
  setCurrentUser: async (user) => {},
  clearCurrentUser: async () => {},
  refreshCurrentUser: async () => {},
  loadAllGames: async (limit) => {},
  reloadTrendingGames: async () => {},
  updateMultiplayerSessions: async () => {},
  reloadPosts: () => {},
  loadMorePosts: () => {},
  loadAppNotifications: async () => {},
};

const CurrentUserContext = React.createContext(CurrentUserContextDefaults);

class CurrentUserContextManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...CurrentUserContextDefaults,
      ...props.value,
      setCurrentUser: this.setCurrentUser,
      clearCurrentUser: this.clearCurrentUser,
      refreshCurrentUser: this.refreshCurrentUser,
      reloadPosts: this.reloadPosts,
      loadMorePosts: this.loadMorePosts,
      loadAllGames: this.loadAllGames,
      reloadTrendingGames: this.reloadTrendingGames,
      updateMultiplayerSessions: this.updateMultiplayerSessions,
      loadAppNotifications: this.loadAppNotifications,
    };

    if (props.value && props.value.user) {
      this.state.timeLastLoaded = Date.now();
    }
  }

  setCurrentUser = async (user) => {
    await this.setState({
      user,
      timeLastLoaded: Date.now(),
    });
    if (
      !this.state.userStatusHistory ||
      !this.state.userStatusHistory.length ||
      !this.state.settings
    ) {
      this.refreshCurrentUser();
    }
  };

  clearCurrentUser = async () => {
    await Actions.logout();
    this.setState({
      ...EMPTY_CURRENT_USER,
    });
  };

  refreshCurrentUser = async () => {
    try {
      const result = await Actions.getCurrentUser();
      if (result.error || result.errors || !result.user) {
        throw new Error(`Unable to fetch current user: ${JSON.stringify(result, null, 2)}`);
      }
      const { user, settings, userStatusHistory } = result;
      this.setState({
        user,
        settings,
        userStatusHistory,
        timeLastLoaded: Date.now(),
      });
    } catch (e) {
      // TODO: failure case
      console.warn(e);
    }
  };

  _loadPosts = async ({ pageAfterPostId } = {}) => {
    if (!this._loadingPosts) {
      this._loadingPosts = true;
      try {
        let posts = await Actions.allPostsAsync({ pageAfterPostId });
        // TODO(jason): keep track of largest postId somewhere before shuffling
        // so that fetching the next page fetches correct
        // shuffle posts per page to make things interesting
        //posts = Utilities.shuffle(posts);
        await this.setState((state) => {
          if (pageAfterPostId !== null && pageAfterPostId !== undefined) {
            let existingPosts = state.content.posts || [];
            posts = existingPosts.concat(posts);
          }
          return {
            ...state,
            content: {
              ...state.content,
              posts,
            },
          };
        });
      } finally {
        this._loadingPosts = false;
      }
    }
  };

  loadAllGames = async (limit) => {
    let data = null;

    try {
      data = await Actions.getAllGames(limit);
    } catch (e) {
      console.log(`Issue fetching all games: ${e}`);
    }

    if (data) {
      let allGames = data.allGames;
      await this.setState((state) => {
        return {
          ...state,
          content: {
            ...state.content,
            allGames,
          },
        };
      });
    }
  };

  reloadTrendingGames = async () => {
    let data = null;

    try {
      data = await Actions.getTrendingGames();
    } catch (e) {
      console.log(`Issue fetching trending games: ${e}`);
    }

    if (data) {
      let trendingGames = data.trendingGames;
      await this.setState((state) => {
        return {
          ...state,
          content: {
            ...state.content,
            trendingGames,
          },
        };
      });
    }
  };

  updateMultiplayerSessions = async (multiplayerSessions) => {
    await this.setState((state) => {
      return {
        ...state,
        content: {
          ...state.content,
          multiplayerSessions,
        },
      };
    });
  };

  reloadPosts = () => {
    this._loadPosts();
  };

  loadMorePosts = () => {
    let lastPostId;
    const { posts } = this.state.content;
    if (posts && posts.length > 0) {
      lastPostId = posts[posts.length - 1].postId;
    }
    this._loadPosts({ pageAfterPostId: lastPostId });
  };

  loadAppNotifications = async () => {
    let notifications = [];
    try {
      notifications = await Actions.appNotificationsAsync();

      // TODO: BEN: remove
      notifications.push({
        type: 'post',
        body: {
          message: [{ userId: 395 }, { text: ' made a post about platformer!' }],
        },
        status: 'unseen',
        appNotificationId: 9,
        updatedTime: '2019-10-03T20:07:06.401Z',
        chatMessageId: null,
        chatChannelId: null,
        gameId: 2,
        authorUserId: 395,
        postId: 18,
      });
    } catch (_) {}
    if (notifications && notifications.length) {
      await Promise.all(notifications.map((n) => this._gatherObjectsFromNotification(n)));
    }
    this.setState({
      appNotifications: notifications,
    });
  };

  _gatherObjectsFromNotification = async (n) => {
    let userIds = {};
    const maybeAddUserId = (userId) => {
      if (userId && !this.props.userPresence.userIdToUser[userId]) {
        userIds[userId] = true;
      }
    };

    maybeAddUserId(n.authorUserId);
    if (n.body && n.body.message) {
      n.body.message.forEach((component) => maybeAddUserId(component.userId));
    }

    const newUserIds = Object.keys(userIds);
    if (newUserIds.length) {
      try {
        let users = await Actions.getUsers({ userIds: newUserIds });
        await this.props.userPresence.addUsers(users);
      } catch (_) {}
    }
  };

  render() {
    return (
      <CurrentUserContext.Provider value={this.state}>
        {this.props.children}
      </CurrentUserContext.Provider>
    );
  }
}

class CurrentUserContextProvider extends React.Component {
  render() {
    return (
      <UserPresenceContext.Consumer>
        {(userPresence) => (
          <CurrentUserContextManager userPresence={userPresence} {...this.props} />
        )}
      </UserPresenceContext.Consumer>
    );
  }
}

export { CurrentUserContext, CurrentUserContextProvider };
