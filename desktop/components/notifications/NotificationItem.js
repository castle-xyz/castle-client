import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIMessageBody from '~/components/reusable/UIMessageBody';

const STYLES_CONTAINER = css`
  width: 100%;
  padding: 8px 16px;
  font-family: ${Constants.REFACTOR_FONTS.system};
  cursor: pointer;
`;

const STYLES_BODY = css`
  font-size: 12px;
  line-height: 16px;
`;

const STYLES_TIMESTAMP = css`
  font-size: 10px;
  color: ${Constants.REFACTOR_COLORS.subdued};
  margin-top: 2px;
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
        <div className={STYLES_BODY}>
          <UIMessageBody body={notification.body} />
        </div>
        <div className={STYLES_TIMESTAMP}>{Strings.toChatDate(notification.updatedTime)}</div>
      </div>
    );
  }
}
