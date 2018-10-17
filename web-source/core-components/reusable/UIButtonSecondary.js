import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_BUTTON = css`
  background: ${Constants.colors.white};
  color: ${Constants.colors.black};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0);
  transition: 200ms ease all;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  height: 32px;
  padding: 0 24px 0 24px;
  outline: 0;
  border: 0;
  cursor: pointer;
  opacity: 1;
  user-select: none;

  :focus {
    outline: 0;
    border: 0;
  }

  :hover {
    opacity: 0.9;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
`;

export default class UIButtonSecondary extends React.Component {
  render() {
    return (
      <button className={STYLES_BUTTON} onClick={this.props.onClick}>
        {this.props.children}
      </button>
    );
  }
}
