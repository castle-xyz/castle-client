import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { SocialContext } from '~/contexts/SocialContext';

const STYLES_CONTAINER = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_INDICATOR_CONTAINER = css`
  width: 12px;
  height: 12px;
  margin: 2px 4px 2px 0;
  border-radius: 6px;
`;

const STYLES_INDICATOR_CONTAINER_SMALL = css`
  width: 9px;
  height: 9px;
  border-radius: 4.5px;
`;

class UIUserStatusIndicator extends React.Component {
  _renderIndicator = (isOnline) => {
    // offline
    let indicatorStyle = { border: `2px solid ${Constants.colors.userStatus.offline}` };
    if (isOnline) {
      indicatorStyle = {
        border: `2px solid ${Constants.colors.userStatus.online}`,
        background: Constants.colors.userStatus.online,
      };
    }
    const indicatorClass = this.props.smallIndicator
      ? STYLES_INDICATOR_CONTAINER_SMALL
      : STYLES_INDICATOR_CONTAINER;
    return <div className={indicatorClass} style={indicatorStyle} />;
  };

  render() {
    const { user } = this.props;
    const isOnline = user.userId && this.props.social.onlineUserIds[user.userId];
    return (
      <div className={STYLES_CONTAINER} style={{ ...this.props.style }}>
        {this._renderIndicator(isOnline)}
      </div>
    );
  }
}

export default class UIUserStatusIndicatorWithContext extends React.Component {
  render() {
    return (
      <SocialContext.Consumer>
        {(social) => <UIUserStatusIndicator social={social} {...this.props} />}
      </SocialContext.Consumer>
    );
  }
}
