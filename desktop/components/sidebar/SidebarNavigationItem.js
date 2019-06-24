import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/common/svg';

import { css, styled } from 'react-emotion';
import { TRANSPARENT_GIF_DATA_URL } from '../../common/constants';

const SVG_ICON = {
  home: <SVG.SidebarGames size="24px" />,
  make: <SVG.SidebarMake size="24px" />,
  examples: <SVG.SidebarGames size="24px" />,
  posts: <SVG.SidebarPosts size="24px" />,
  history: <SVG.SidebarHistory size="24px" />,
  documentation: <SVG.SidebarDocs size="24px" />,
};

const STYLES_ITEM = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 17px;
  font-weight: 600;
  margin: 8px 0 8px 0;
  padding: 0 16px 0 16px;
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
  padding: 0px 10px 0 10px;
`;

const STYLES_SYMBOL = css`
  padding-top: 0px;
  flex-shrink: 0;
`;

export default ({ data }) => {
  return (
    <div
      className={STYLES_ITEM}
      style={{ color: data.active ? 'magenta' : null }}
      onClick={data.active ? () => {} : data.onClick}>
      <span className={STYLES_SYMBOL}>{SVG_ICON[data.svg]}</span>
      <span className={STYLES_NAME}>{data.name}</span>
    </div>
  );
};
