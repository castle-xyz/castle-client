import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIMessageBody from '~/components/reusable/UIMessageBody';

const STYLES_CONTAINER = css`
  width: 100%;
  padding: 8px;
  font-family: ${Constants.REFACTOR_FONTS.system};
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
`;

export default class NotificationItem extends React.Component {
  static defaultProps = {
    notification: {},
    onSelectNotification: () => {},
  };

  render() {
    const { notification } = this.props;
    if (!notification || !notification.body) {
      return null;
    }

    return (
      <div
        className={STYLES_CONTAINER}
        onClick={() => this.props.onSelectNotification(notification)}>
        <UIMessageBody body={notification.body} />
      </div>
    );
  }
}
