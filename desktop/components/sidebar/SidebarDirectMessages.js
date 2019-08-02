import * as React from 'react';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import SidebarMessageItem from '~/components/sidebar/SidebarMessageItem';
import UserStatus from '~/common/userstatus';

const STYLES_CONTAINER = css`
  margin-bottom: 16px;
`;

export default class SidebarDirectMessages extends React.Component {
  render() {
    const { channels, viewer } = this.props;
    if (!viewer) {
      return null;
    }

    const { onlineUserIds, userIdToUser } = this.props.userPresence;
    let directMessages = [];
    Object.entries(channels).forEach(([channelId, channel]) => {
      if (channel.type === 'dm') {
        directMessages.push({
          ...channel,
          otherUserIsOnline: onlineUserIds[channel.otherUserId],
        });
      }
    });
    directMessages = ChatUtilities.sortChannels(directMessages);

    return (
      <div className={STYLES_CONTAINER}>
        {directMessages.map((c) => {
          const isSelected =
            c.channelId === this.props.selectedChannelId && this.props.isChatVisible;

          const user = userIdToUser[c.otherUserId];
          if (!user) {
            return;
          }

          let { status } = UserStatus.renderStatusText(user.lastUserStatus);

          return (
            <SidebarMessageItem
              key={`direct-message-${c.channelId}-${c.otherUserId}`}
              name={Strings.getName(user)}
              isUnread={c.hasUnreadMessages}
              notificationCount={c.unreadNotificationCount}
              isOnline={c.otherUserIsOnline}
              isSelected={isSelected}
              status={status}
              avatarUrl={user.photo ? user.photo.url : null}
              onClick={() => this.props.onSelectChannel(c)}
            />
          );
        })}
      </div>
    );
  }
}
