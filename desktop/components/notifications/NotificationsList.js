import * as React from 'react';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';

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
  };

  render() {
    const { notifications } = this.props;
    return (
      <div className={STYLES_CONTAINER}>
        {notifications.map((n) => (
          <div>{JSON.stringify(n)}</div>
        ))}
      </div>
    );
  }
}

export default class NotificationsListWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => <NotificationsList notifications={currentUser.appNotifications} />}
      </CurrentUserContext.Consumer>
    );
  }
}
