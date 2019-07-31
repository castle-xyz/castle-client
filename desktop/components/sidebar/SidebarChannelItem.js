import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';

const STYLES_CHANNEL = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  user-select: none;
  font-size: 14px;
  margin: 0;
  padding: 4px 16px 4px 16px;
  cursor: pointer;
  transition: 200ms ease color;
  color: ${Constants.REFACTOR_COLORS.text};

  :hover {
    color: magenta;
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

const STYLES_NAME = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  min-width: 10%;
  width: 100%;
  padding: 0 8px 0 8px;
  line-height: 20px;
`;

const STYLES_SYMBOL = css`
  margin-top: 3px;
  flex-shrink: 0;
  color: #6e6e6e;
`;

export default (props) => {
  const { channel, isSelected, onClick } = props;
  let fontWeight, unreadCount, selectedStyles;
  if (channel.hasUnreadMessages && !isSelected) {
    fontWeight = '700';
    unreadCount = channel.unreadNotificationCount;
  }
  if (isSelected) {
    selectedStyles = {
      color: 'magenta',
      backgroundColor: '#f9f9f9',
    };
  }
  let icon;
  let iconStyles = isSelected ? { color: 'magenta' } : null;
  switch (channel.type) {
    case 'game':
      icon = <SVG.SidebarGames size="14px" style={iconStyles} />;
      break;
    case 'create':
      icon = <SVG.Castle size="14px" style={iconStyles} />;
      break;
    default:
      icon = <SVG.HashTag size="14px" style={iconStyles} />;
  }

  return (
    <div className={STYLES_CHANNEL} style={selectedStyles} onClick={onClick ? onClick : null}>
      <span className={STYLES_SYMBOL}>{icon}</span>
      <span className={STYLES_NAME} style={{ fontWeight }}>
        {channel.name}
      </span>
      {unreadCount ? <span className={STYLES_NOTIFICATION}>{unreadCount}</span> : null}
    </div>
  );
};
