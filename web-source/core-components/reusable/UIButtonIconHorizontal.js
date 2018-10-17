import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_ICON_BUTTON = css`
  display: inline-flex;
  margin-bottom: 8px;
  color: ${Constants.colors.black};
  cursor: pointer;
  font-weight: 600;
  font-size: 10px;
  border-radius: 4px;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.07);
  user-select: none;
  opacity: 1;
  transition: 200ms ease all;

  :hover {
    opacity: 0.9;
  }
`;

const STYLES_ICON_BUTTON_LEFT = css`
  display: inline-flex;
  height: 36px;
  width: 36px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px 0 0 4px;
  align-items: center;
  justify-content: center;
  border-right: 1px solid ${Constants.colors.black10};
`;

const STYLES_ICON_BUTTON_RIGHT = css`
  display: inline-flex;
  align-items: center;
  padding: 0 16px 0 16px;
  height: 36px;
  border-radius: 0 4px 4px 0;
  background: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export default props => {
  return (
    <div className={STYLES_ICON_BUTTON} {...props}>
      <span className={STYLES_ICON_BUTTON_LEFT}>{props.icon}</span>
      <span className={STYLES_ICON_BUTTON_RIGHT}>{props.children}</span>
    </div>
  );
};
