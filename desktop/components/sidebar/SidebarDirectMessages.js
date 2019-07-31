import * as React from 'react';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import SidebarGroupChannelItem from '~/components/sidebar/SidebarGroupChannelItem';
import SidebarDirectMessageItem from '~/components/sidebar/SidebarDirectMessageItem';
import SidebarNavigationItem from '~/components/sidebar/SidebarNavigationItem';

const STYLES_CONTAINER = css`
  margin-bottom: 24px;
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
        <SidebarNavigationItem
          name="Chat"
          svg="chat"
          onClick={() => this.props.onSelectChannel(this.props.lobbyChannel)}
        />
        <SidebarGroupChannelItem
          numMembersOnline={this.props.numUsersOnline}
          channel={this.props.lobbyChannel}
          userPresence={this.props.userPresence}
          isSelected={this.props.isLobbySelected}
          onClick={() => this.props.onSelectChannel(this.props.lobbyChannel)}
        />
        {directMessages.map((c) => {
          const isSelected =
            c.channelId === this.props.selectedChannelId && this.props.isChatVisible;

          const user = userIdToUser[c.otherUserId];
          if (!user) {
            return;
          }

          return (
            <SidebarDirectMessageItem
              key={`direct-message-${c.channelId}-${c.otherUserId}`}
              channel={c}
              isSelected={isSelected}
              user={user}
              onClick={() => this.props.onSelectChannel(c)}
            />
          );
        })}
      </div>
    );
  }
}
