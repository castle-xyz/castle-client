import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_CONTAINER = css`
  width: 100%;
  font-family: ${Constants.REFACTOR_FONTS.system};
  color: ${Constants.REFACTOR_COLORS.subdued};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1px;
  text-align: center;
  border-bottom: 1px solid #ececec;
  margin: 16px 0 16px 0;
  padding-bottom: 8px;
  cursor: default;
`;

export default class NotificationSectionHeader extends React.Component {
  static defaultProps = {
    unseen: true,
  };

  render() {
    return <div className={STYLES_CONTAINER}>{this.props.unseen ? 'New' : 'Older'}</div>;
  }
}
