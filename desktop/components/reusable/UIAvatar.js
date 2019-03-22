import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

// TODO(jim): Need to revisit this primitive.
const STYLES_ICON = css`
  height: 48px;
  width: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background-position: 50% 50%;
  background-size: cover;
  background-color: #171717;
`;

export default class UIAvatar extends React.Component {
  render() {
    const { src, icon } = this.props;
    const maybeIconChild = !src && icon ? icon : null;

    const avatarContextStyles = {
      backgroundImage: `url('${src}')`,
      cursor: this.props.onClick ? 'pointer' : null,
    };

    let maybeEmptyStyles = {};
    if (!maybeIconChild && !src) {
      maybeEmptyStyles = {
        backgroundColor: Constants.colors.black25,
      };
    }

    return (
      <span
        className={STYLES_ICON}
        onClick={this.props.onClick}
        style={{ ...avatarContextStyles, ...maybeEmptyStyles, ...this.props.style }}>
        {maybeIconChild}
      </span>
    );
  }
}
