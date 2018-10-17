import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_CONTAINER = css`
  padding: 16px;
  color: ${Constants.colors.white};
`;

const STYLES_HEADER = css`
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.2px;
  margin-bottom: 8px;
`;

const STYLES_PARAGRAPH = css`
  font-size: 14px;
  font-weight: 200;
  line-height: 1.725;
  margin-bottom: 8px;
`;

export default class UIEmptyState extends React.Component {
  render() {
    return (
      <div className={STYLES_CONTAINER} style={this.props.style} onClick={this.props.onClick}>
        <div className={STYLES_HEADER}>{this.props.title}</div>
        <div className={STYLES_PARAGRAPH}>{this.props.children}</div>
      </div>
    );
  }
}
