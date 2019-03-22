import { css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';

const STYLES_USE_LIGHT_TEXT = css`
  color: ${Constants.colors.white};

  &:visited {
    color: ${Constants.colors.white};
  }
`;

const STYLES_USE_DARK_TEXT = css`
  color: ${Constants.colors.text};

  &:visited {
    color: ${Constants.colors.text};
  }
`;

const STYLES_BUTTON = css`
  font-family: ${Constants.font.castle};
  font-size: 32px;
  line-height: 26px;
  outline: 0;
  margin: 0;
  padding: 0;
  border: 0;
  cursor: pointer;
  font-weight: 400;
  user-select: none;
  background-color: transparent;
  transition: 200ms ease all;
  text-decoration: none;

  @keyframes button-color-change {
    0% {
      color: ${Constants.colors.brand4};
    }
    50% {
      color: ${Constants.colors.brand1};
    }
    100% {
      color: ${Constants.colors.brand2};
    }
  }

  &:hover {
    animation: button-color-change infinite 300ms;
  }

  &:focus {
    outline: 0;
    border: 0;
  }
`;

export default class WebButton extends React.Component {
  render() {
    const textMode = Utilities.getColorTypeFromHex(
      this.props.background ? this.props.background : `#000000`
    );

    let buttonClass = STYLES_USE_LIGHT_TEXT;
    if (textMode === 'DARK') {
      buttonClass = STYLES_USE_DARK_TEXT;
    }

    if (this.props.href) {
      return (
        <a
          href={this.props.href}
          style={this.props.style}
          className={`${STYLES_BUTTON} ${buttonClass}`}>
          {this.props.children}
        </a>
      );
    }

    return (
      <span
        onClick={this.props.onClick}
        style={this.props.style}
        className={`${STYLES_BUTTON} ${buttonClass}`}>
        {this.props.children}
      </span>
    );
  }
}
