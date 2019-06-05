import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/common/svg';

import { css, styled } from 'react-emotion';

const SVG_ICON = {
  make: <SVG.SidebarMake size="18px" />,
  featured: <SVG.SidebarFeaturedGames size="18px" />,
  posts: <SVG.SidebarPosts size="18px" />,
  history: <SVG.SidebarHistory size="18px" />,
};

const STYLES_ITEM = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 8px 0;
  padding: 0 16px 0 16px;
  transition: 200ms ease color;

  :hover {
    color: magenta;
  }
`;

const STYLES_NAME = css`
  min-width: 10%;
  width: 100%;
  cursor: pointer;
  padding: 0px 8px 0 8px;
`;

const STYLES_SYMBOL = css`
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
