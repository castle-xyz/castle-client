import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';

const STYLES_CONTAINER = css`
  padding: 0 16px 0 16px;
  user-select: none;
`;

const STYLES_PROJECT = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: 8px 0 8px 0;
  font-size: 14px;
  transition: 200ms ease color;
  cursor: pointer;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const STYLES_SYMBOL = css`
  margin-top: 3px;
  flex-shrink: 0;
  color: #6e6e6e;
`;

const truncatePath = (path, chars) => {
  if (path && path.length <= chars) {
    return path;
  } else {
    return `...${path.slice(-(chars - 3))}`;
  }
};

export default (props) => {
  const { project, isSelected, onClick } = props;
  let fontWeight, unreadCount, selectedStyles;
  if (project.hasUnreadMessages && !isSelected) {
    fontWeight = '700';
    unreadCount = project.unreadNotificationCount;
  }
  if (isSelected) {
    selectedStyles = {
      color: 'magenta',
      backgroundColor: '#f9f9f9',
    };
  }
  let name;
  if (project.name) {
    name = project.name;
  } else if (project.url) {
    name = truncatePath(project.url, 23);
  } else {
    name = 'Untitled';
  }

  return (
    <div className={STYLES_CONTAINER}>
      <div className={STYLES_PROJECT} style={selectedStyles} onClick={onClick ? onClick : null}>
        <span className={STYLES_SYMBOL}>
          <SVG.Castle size="14px" />
        </span>
        <span className={STYLES_NAME} style={{ fontWeight }}>
          {name}
        </span>
        {unreadCount ? <span className={STYLES_NOTIFICATION}>{unreadCount}</span> : null}
      </div>
    </div>
  );
};
