import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { NavigatorContext } from '~/contexts/NavigationContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatMembersItem from '~/components/chat/ChatMembersItem';

const STYLES_CONTAINER = css`
  height: 100%;
  padding: 16px;
  min-height: 25%;
  width: 100%;
  overflow-y: scroll;
  overflow-wrap: break-word;

  ::-webkit-scrollbar {
    display: none;
  }
`;

class ChatMembers extends React.Component {
  static defaultProps = {
    userIds: [],
    userPresence: null,
    onSendMessage: (user) => {},
  };

  componentDidMount() {
    const { userIds, userPresence } = this.props;
    this._fetchMissingUsers(userIds, userPresence);
  }

  _fetchMissingUsers = async (userIds, userPresence) => {
    const userIdsToFetch = userIds.filter(
      (userId) => userPresence.onlineUserIds[userId] && !userPresence.userIdToUser[userId]
    );
    if (userIdsToFetch && userIdsToFetch.length) {
      const result = await Actions.getUsers({ userIds: userIdsToFetch });
      await this.props.userPresence.addUsers(result);
    }
  };

  render() {
    const { userIds, userPresence, navigateToGameUrl, navigateToUserProfile } = this.props;
    const { userIdToUser, onlineUserIds } = userPresence;
    return (
      <div className={STYLES_CONTAINER}>
        {userIds
          .filter((userId) => onlineUserIds[userId])
          .map((userId) => userIdToUser[userId])
          .map((user, ii) => (
            <ChatMembersItem
              key={`user-item-${ii}`}
              user={user}
              isOnline={true}
              navigateToGameUrl={navigateToGameUrl}
              navigateToUserProfile={navigateToUserProfile}
              onSendMessage={this.props.onSendMessage}
            />
          ))}
      </div>
    );
  }
}

export default class ChatMembersWithContext extends React.Component {
  render() {
    return (
      <UserPresenceContext.Consumer>
        {(userPresence) => (
          <NavigatorContext.Consumer>
            {(navigator) => (
              <ChatMembers
                userPresence={userPresence}
                navigateToGameUrl={navigator.navigateToGameUrl}
                navigateToUserProfile={navigator.navigateToUserProfile}
                {...this.props}
              />
            )}
          </NavigatorContext.Consumer>
        )}
      </UserPresenceContext.Consumer>
    );
  }
}
