import * as React from 'react';
import * as Actions from '~/common/actions';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigatorContext } from '~/contexts/NavigationContext';

import NotificationItem from '~/components/notifications/NotificationItem';

const STYLES_CONTAINER = css`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
`;

class NotificationsList extends React.Component {
  static defaultProps = {
    notifications: [],
    reloadNotifications: async () => {},
  };

  componentDidMount() {
    this.props.reloadNotifications();
  }

  _handleSelectNotification = async (notification) => {
    switch (notification.type) {
      case 'post': {
        try {
          const fullGame = await Actions.getGameByGameId(notification.gameId);
          this.props.navigator.navigateToGameMeta(fullGame);
        } catch (e) {}
        break;
      }
    }
  };

  render() {
    const { notifications } = this.props;
    return (
      <div className={STYLES_CONTAINER}>
        {notifications.map((n, ii) => (
          <NotificationItem
            key={`notification-${ii}`}
            notification={n}
            onSelectNotification={this._handleSelectNotification}
          />
        ))}
      </div>
    );
  }
}

export default class NotificationsListWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => (
          <NavigatorContext.Consumer>
            {(navigator) => (
              <NotificationsList
                notifications={currentUser.appNotifications}
                reloadNotifications={currentUser.loadAppNotifications}
                navigator={navigator}
              />
            )}
          </NavigatorContext.Consumer>
        )}
      </CurrentUserContext.Consumer>
    );
  }
}
