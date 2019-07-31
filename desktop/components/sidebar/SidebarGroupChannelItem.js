import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';
import { EVERYONE_CHANNEL_NAME } from '~/common/chat-utilities';

import UIAvatar from '~/components/reusable/UIAvatar';
import UserStatus from '~/common/userstatus';

const STYLES_USER = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 12px;
  margin: 0 0 4px 0;
  padding: 4px 16px 4px 16px;
  cursor: pointer;
  user-select: none;
  transition: 200ms ease color;

  :hover {
    h3 {
      color: magenta;
    }
  }
`;

const STYLES_NOTIFICATION = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  font-weight: 600;
  background: rgb(255, 0, 235);
  color: white;
  height: 14px;
  margin-top: 2px;
  padding: 0 6px 0 6px;
  border-radius: 14px;
  font-size: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0px;
`;

const STYLES_TEXT = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  padding: 0 8px 0 8px;
  min-width: 10%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const STYLES_NAME = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  font-size: 12px;
  margin-top: 2px;
`;

const STYLES_STATUS = css`
  margin-top: 4px;
  font-size: 10px;
`;

const STYLES_AVATARS = css`
  display: inline-block;
  position: relative;
`;

export default (props) => {
  const { channel, isSelected, onClick, numMembersOnline, userPresence } = props;
  if (!channel) return null;

  let color,
    backgroundColor,
    fontWeight = '400',
    unreadCount;
  if (isSelected) {
    color = 'magenta';
    backgroundColor = '#f9f9f9';
  }
  if (channel.hasUnreadMessages && !isSelected) {
    fontWeight = '700';
    unreadCount = channel.unreadNotificationCount;
  }

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

  return (
    <div className={STYLES_USER} onClick={!isSelected ? onClick : null} style={{ backgroundColor }}>
      {maybeAvatar}
      <div className={STYLES_TEXT}>
        <h3 className={STYLES_NAME} style={{ color, fontWeight }}>
          {channel.name == EVERYONE_CHANNEL_NAME ? 'Everyone' : channel.name}
        </h3>
        {numMembersOnline ? <span className={STYLES_STATUS}>{numMembersOnline} online</span> : null}
      </div>
      {unreadCount ? <span className={STYLES_NOTIFICATION}>{unreadCount}</span> : null}
    </div>
  );
};
