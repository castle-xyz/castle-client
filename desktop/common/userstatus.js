import * as Actions from '~/common/actions';
import * as Urls from '~/common/urls';

const USERSTATUS_PING_INTERVAL_SEC = 25;

class UserStatus {
  _game = null;
  _status = null;
  _pingInterval = null;

  _recordUserStatus = async (isNewSession) => {
    const result = await Actions.recordUserStatus(this._status, isNewSession, this._game);
    if (result.errors && result.errors.length) {
      if (result.errors[0].extensions.code === 'LOGIN_REQUIRED') {
        // if the user logged out, don't send any further pings
        this.stop();
      }
    }
  };

  stop = () => {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
    this._game = null;
    this._status = null;
  };

  startAsync = async (game) => {
    this.stop();
    this._game = game;
    this._status = Urls.isPrivateUrl(game.url) ? 'make' : 'play';
    this._recordUserStatus(true);
    this._pingInterval = setInterval(
      () => this._recordUserStatus(false),
      USERSTATUS_PING_INTERVAL_SEC * 1000
    );
  };

  _isDateRecentEnough = (dateStr) => {
    if (dateStr) {
      let secondsElapsed = 0;
      try {
        const date = new Date(dateStr);
        const recentTime = Math.floor(date.getTime() / 1000);
        const currentTime = Math.floor(Date.now() / 1000);
        secondsElapsed = currentTime - recentTime;
      } catch (_) {
        return false;
      }
      return secondsElapsed < 60 * 60 * 24;
    }
    return false;
  };

  _recentDateToString = (dateStr) => {
    let secondsElapsed = 0;
    try {
      const date = new Date(dateStr);
      const recentTime = Math.floor(date.getTime() / 1000);
      const currentTime = Math.floor(Date.now() / 1000);
      secondsElapsed = currentTime - recentTime;
    } catch (_) {}
    if (!secondsElapsed) {
      return '';
    } else if (secondsElapsed < 60 * 2) {
      return 'just now';
    } else if (secondsElapsed < 60 * 15) {
      return `${Math.floor(secondsElapsed / 60)} minutes ago`;
    } else if (secondsElapsed < 60 * 60) {
      return 'less than an hour ago';
    } else if (secondsElapsed < 60 * 60 * 2) {
      return 'an hour ago';
    } else if (secondsElapsed < 60 * 60 * 6) {
      return `${Math.floor(secondsElapsed / 60 / 60)} hours ago`;
    } else if (secondsElapsed < 60 * 60 * 24) {
      return `in the last day`;
    } else if (secondsElapsed < 60 * 60 * 24 * 2) {
      return `a day ago`;
    } else if (secondsElapsed < 60 * 60 * 24 * 7) {
      return `${Math.floor(secondsElapsed / 60 / 60 / 24)} days ago`;
    }
    return 'over a week ago';
  };

  renderStatusText = (userStatus) => {
    let verb, title, statusString;
    const { status, isRecent, lastPing, game } = userStatus;
    title = game && game.name ? game.name : 'an untitled game';
    if (title && title.length > 32) {
      title = `${title.substring(0, 29)}...`;
    }
    if (isRecent) {
      verb = status === 'make' ? 'Making' : 'Playing';
      statusString = `${verb} ${title}`;
    } else if (this._isDateRecentEnough(userStatus.lastPing)) {
      verb = status === 'make' ? 'Last made' : 'Last played';
      statusString = `${verb} ${title}`;
    }
    return {
      verb,
      title,
      status: statusString,
    };
  };

  uniqueLocalUserStatuses = (statuses) => {
    if (!statuses || !statuses.length) return [];

    let seenUrls = {};
    return statuses.filter((item) => {
      const { game } = item;
      let isPrivate = Urls.isPrivateUrl(game.url);
      let isLocalFile = isPrivate || !game.owner;
      let isAlreadySeen = seenUrls[game.url] === true;
      seenUrls[game.url] = true;
      return isLocalFile && !isAlreadySeen;
    });
  };

  uniqueRegisteredUserStatuses = (statuses) => {
    if (!statuses || !statuses.length) return [];

    let seenUrls = {};
    return statuses.filter((item) => {
      const { game } = item;
      let isPrivate = Urls.isPrivateUrl(game.url);
      let isLocalFile = isPrivate || !game.owner;
      let isAlreadySeen = seenUrls[game.url] === true;
      seenUrls[game.url] = true;
      return !isLocalFile && game.gameId && !isAlreadySeen;
    });
  };
}

export default new UserStatus();
