import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';

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

export default (props) => {
  const { channel, isSelected, onClick, user } = props;
  if (!user) {
    return null;
  }

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

  let { status } = UserStatus.renderStatusText(user.lastUserStatus);

  return (
    <div className={STYLES_USER} onClick={!isSelected ? onClick : null} style={{ backgroundColor }}>
      <UIAvatar src={user.photo ? user.photo.url : null} isOnline={channel.otherUserIsOnline} />
      <div className={STYLES_TEXT}>
        <h3 className={STYLES_NAME} style={{ color, fontWeight }}>
          {Strings.getName(user)}
        </h3>
        {status && channel.otherUserIsOnline ? (
          <span className={STYLES_STATUS}>{status}</span>
        ) : null}
      </div>
      {unreadCount ? <span className={STYLES_NOTIFICATION}>{unreadCount}</span> : null}
    </div>
  );
};
