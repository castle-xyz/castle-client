import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_ICON = css`
  height: 48px;
  width: 48px;
  background: ${Constants.colors.black};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  background-position: 50% 50%;
  background-size: cover;
`;

export default class UIAvatar extends React.Component {
  render() {
    const avatarContextStyles = {
      backgroundImage: `url('${this.props.src}')`,
      cursor: this.props.onClick ? 'pointer' : null,
    };

    if (!this.props.src && this.props.icon) {
      return (
        <span
          className={STYLES_ICON}
          onClick={this.props.onClick}
          style={{ ...this.props.style, ...avatarContextStyles }}>
          {this.props.icon}
        </span>
      );
    }

    return (
      <span
        className={STYLES_ICON}
        onClick={this.props.onClick}
        style={{ ...this.props.style, ...avatarContextStyles }}
      />
    );
  }
}
