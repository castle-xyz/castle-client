import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_CONTROL = css`
  font-family: ${Constants.font.mono};
  font-size: 10px;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  opacity: 1;
  transition: 200ms ease opacity;
  white-space: nowrap;

  :hover {
    opacity: 0.8;
  }
`;

export default class UIControl extends React.Component {
  render() {
    return (
      <span
        className={STYLES_CONTROL}
        onClick={this.props.onClick}
        children={this.props.children}
        style={{ ...this.props.style, color: this.props.isActive ? Constants.colors.green : null }}
      />
    );
  }
}
