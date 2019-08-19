import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';

const STYLES_PLAY_ICON = css`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${Constants.card.iconColor};
`;

const STYLES_PLAY_HOVER = css`
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

  cursor: pointer;
  animation: button-color-change infinite 400ms;
  color: white;
`;

export default class UIPlayIcon extends React.Component {
  static defaultProps = {
    visible: true,
    hovering: false,
    size: 16,
  };

  render() {
    const { visible, hovering, size } = this.props;
    return (
      <div
        className={hovering ? `${STYLES_PLAY_ICON} ${STYLES_PLAY_HOVER}` : STYLES_PLAY_ICON}
        style={[{ visibility: visible ? 'visible' : 'hidden' }, this.props.style]}>
        <SVG.Play style={{ width: size, height: size }} />
      </div>
    );
  }
}
