import * as React from 'react';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';
import { Tooltip } from 'react-tippy';

import UIAvatar from '~/components/reusable/UIAvatar';

const STYLES_HEADER = css`
  background: #ececed;
  border-bottom: 1px solid ${Constants.REFACTOR_COLORS.elements.border};
  color: ${Constants.REFACTOR_COLORS.text};
  font-family: ${Constants.REFACTOR_FONTS.system};
  width: 100%;
  height: ${Constants.sidebar.collapsedWidth};
  max-height: ${Constants.sidebar.collapsedWidth};
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_VIEWER = css`
  display: flex;
  width: ${Constants.sidebar.collapsedWidth};
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const STYLES_VIEWER_CONTAINER = css`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
`;

const TOOLTIP_PROPS = {
  arrow: true,
  duration: 170,
  animation: 'fade',
  hideOnClick: false,
  position: 'left',
};

const STYLES_HEADER_LEFT = css`
  padding: 8px 8px 8px 16px;
  min-width: 25%;
  width: 100%;
`;

const STYLES_H2 = css`
  font-size: 12px;
`;

const STYLES_P = css`
  margin: 4px 0 4px 0;
  font-size: 12px;
  line-height: 14px;
  height: 12px;
  color: ${Constants.REFACTOR_COLORS.subdued};

  span {
    display: inline-block;
    vertical-align: top;
  }
`;

const STYLES_ONLINE = css`
  color: ${Constants.REFACTOR_COLORS.subdued}:
  cursor: pointer;

  span {
    padding: 0 8px 0 8px;
  }

  #action {
    display: inline;
    cursor: pointer;

    :hover {
      color: magenta;
    }
  }
`;

const STYLES_LINK = css`
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
`;

const STYLES_CHANNEL_NAME = css``;

export default class SocialSidebarHeader extends React.Component {
  static defaultProps = {
    mode: 'chat',
    isExpanded: true,
  };

  _renderTitle = () => {
    const { mode, channel, onChannelClick } = this.props;
    let content;
    if (mode === 'notifications') {
      content = <span className={STYLES_CHANNEL_NAME}>My Notifications</span>;
    } else if (channel.type === 'dm') {
      content = (
        <span className={STYLES_CHANNEL_NAME} onClick={onChannelClick}>
          {channel.name}
        </span>
      );
    } else {
      let name;
      if (channel.name === ChatUtilities.EVERYONE_CHANNEL_NAME) {
        name = 'Community Chat';
      } else {
        name = channel.name;
      }
      content = (
        <span className={STYLES_CHANNEL_NAME} onClick={onChannelClick}>
          {name}
        </span>
      );
    }
    return <h2 className={STYLES_H2}>{content}</h2>;
  };

  _getHeading = () => {
    const { mode, channel, viewer } = this.props;
    if (mode === 'notifications') {
      let username = viewer ? viewer.username : '';
      return `Signed in as ${username}`;
    }
    switch (channel.type) {
      case 'dm':
        return `A private conversation with ${channel.name}`;
      case 'game':
        return `People playing ${channel.name}`;
      default:
        if (channel.name === ChatUtilities.EVERYONE_CHANNEL_NAME) {
          return 'Everyone on Castle';
        }
        break;
    }
    return 'This is a public channel.';
  };

  _getLeaveMessage = () => {
    const { channel } = this.props;
    switch (channel.type) {
      case 'dm':
        return 'Leave conversation';
        break;
      default:
        return 'Leave channel';
        break;
    }
  };

  _renderActions = () => {
    const { mode, channel, numChannelMembers } = this.props;

    // TODO: notifications unread count
    if (mode === 'notifications') {
      return null;
    }

    if (channel.type !== 'dm' && numChannelMembers) {
      return (
        <span className={STYLES_ONLINE} onClick={this.props.onMembersClick}>
          <span>&middot;</span>
          <div id="action">{numChannelMembers} online</div>
        </span>
      );
    } else {
      return null;
    }
  };

  _renderViewer = () => {
    const { viewer, onSelectNotifications } = this.props;
    const avatarSrc = viewer && viewer.photo ? viewer.photo.url : null;
    return (
      <Tooltip title={`Notifications for ${viewer.username}`} {...TOOLTIP_PROPS}>
        <div className={STYLES_VIEWER_CONTAINER}>
          <UIAvatar
            src={avatarSrc}
            onClick={onSelectNotifications}
            showIndicator={false}
            style={{
              height: `28px`,
              width: `28px`,
            }}
          />
        </div>
      </Tooltip>
    );
  };

  render() {
    const { channel, isExpanded } = this.props;
    if (!channel) {
      return null;
    }

    return (
      <header className={STYLES_HEADER}>
        {isExpanded ? (
          <div className={STYLES_HEADER_LEFT}>
            {this._renderTitle()}
            <div className={STYLES_P}>
              <span>{this._getHeading()}</span>
              {this._renderActions()}
            </div>
          </div>
        ) : null}
        <div className={STYLES_VIEWER}>{this._renderViewer()}</div>
      </header>
    );
  }
}
