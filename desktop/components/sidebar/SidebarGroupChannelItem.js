import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';
import { EVERYONE_CHANNEL_NAME } from '~/common/chat-utilities';

import SidebarMessageItem from '~/components/sidebar/SidebarMessageItem';
import UIAvatar from '~/components/reusable/UIAvatar';

const STYLES_AVATARS = css`
  display: inline-block;
  position: relative;
`;

export default (props) => {
  const { channel, isSelected, onClick, numMembersOnline, userPresence } = props;
  if (!channel) return null;

  let maybeAvatar = null;
  if (userPresence && numMembersOnline > 0) {
    let someUserIds = Object.keys(userPresence.onlineUserIds).filter(
      (userId) => !!userPresence.userIdToUser[userId] && !!userPresence.userIdToUser[userId].photo
    );
    if (someUserIds && someUserIds.length) {
      const selectedUserIds = someUserIds.slice(0, 4);
      const avatarSpacing = 6;
      maybeAvatar = (
        <div
          className={STYLES_AVATARS}
          style={{ width: 24, height: 18 + (selectedUserIds.length - 1) * avatarSpacing }}>
          {selectedUserIds.map((userId, ii) => (
            <UIAvatar
              src={userPresence.userIdToUser[userId].photo.url}
              isOnline={true}
              style={{ position: 'absolute', top: ii * avatarSpacing, border: '1px solid #fcfcfc' }}
            />
          ))}
        </div>
      );
    }
  }

  const name = channel.name == EVERYONE_CHANNEL_NAME ? 'Everyone' : channel.name;
  const status = numMembersOnline ? `${numMembersOnline} online` : null;

  return (
    <SidebarMessageItem
      {...props}
      name={name}
      isUnread={channel.hasUnreadMessages}
      notificationCount={channel.notificationCount}
      isOnline={true}
      isSelected={isSelected}
      status={status}
      avatarElement={maybeAvatar}
      onClick={onClick}
    />
  );
};
