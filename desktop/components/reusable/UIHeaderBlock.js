import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';

const STYLES_HEADER = css`
  font-family: ${Constants.font.system};
  height: 32px;
  width: 100%;
  background: #2b2828;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.1px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_LEFT = css`
  min-width: 25%;
  width: 100%;
  padding: 0 16px 0 8px;
`;

const STYLES_RIGHT = css`
  flex-shrink: 0;
  padding: 0 8px 0 8px;
  color: ${Constants.colors.white};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
`;

export default class UIHeaderBlock extends React.Component {
  render() {
    return (
      <span className={STYLES_HEADER} style={this.props.style} onClick={this.props.onClick}>
        <span className={STYLES_LEFT}>{this.props.children}</span>
        {this.props.onDismiss ? (
          <span className={STYLES_RIGHT} onClick={this.props.onDismiss}>
            <SVG.Dismiss height="10px" style={{ marginTop: 2 }} />
          </span>
        ) : null}
      </span>
    );
  }
}
