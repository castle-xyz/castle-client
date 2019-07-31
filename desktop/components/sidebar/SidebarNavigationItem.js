import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';

import { css, styled } from 'react-emotion';
import { TRANSPARENT_GIF_DATA_URL } from '../../common/constants';

const ICON_SIZE = '16px';

const SVG_ICON = {
  home: <SVG.SidebarGames size={ICON_SIZE} />,
  make: <SVG.SidebarMake size={ICON_SIZE} />,
  chat: <SVG.SidebarChat size={ICON_SIZE} />,
  examples: <SVG.SidebarGames size={ICON_SIZE} />,
  posts: <SVG.SidebarPosts size={ICON_SIZE} />,
  history: <SVG.SidebarHistory size={ICON_SIZE} />,
  documentation: <SVG.SidebarDocs size={ICON_SIZE} />,
};

const STYLES_ITEM = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  padding: 4px 16px 4px 16px;
  transition: 70ms ease color;
  user-select: none;
  :hover {
    color: magenta;
  }
`;

const STYLES_NAME = css`
  min-width: 10%;
  width: 100%;
  cursor: pointer;
  padding: 0 10px 3px 8px;
`;

const STYLES_SYMBOL = css`
  padding-top: 0px;
  flex-shrink: 0;
`;

const STYLES_NOTIFICATION = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  font-weight: 600;
  background: rgb(255, 0, 235);
  color: white;
  height: 14px;
  padding: 0 6px 0 6px;
  border-radius: 14px;
  font-size: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0px;
`;

export default (props) => {
  let fontWeight, unreadCount, selectedStyles;
  if (props.hasUnreadMessages && !props.active) {
    fontWeight = '700';
    unreadCount = props.unreadNotificationCount;
  }
  if (props.active) {
    selectedStyles = {
      color: 'magenta',
      backgroundColor: '#f9f9f9',
    };
  }
  fontWeight = '700';
  return (
    <div
      className={STYLES_ITEM}
      style={selectedStyles}
      onClick={props.active ? null : props.onClick}>
      <span className={STYLES_SYMBOL}>{SVG_ICON[props.svg]}</span>
      <span className={STYLES_NAME} style={{ fontWeight }}>
        {props.name}
      </span>
      {unreadCount ? <span className={STYLES_NOTIFICATION}>{unreadCount}</span> : null}
    </div>
  );
};
