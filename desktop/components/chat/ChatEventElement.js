import * as React from 'react';
import * as Strings from '~/common/strings';
import * as Constants from '~/common/constants';

import { css, styled } from 'react-emotion';

import ChatMessageHeader from '~/components/chat/ChatMessageHeader';
import UIMessageBody from '~/components/reusable/UIMessageBody';

const STYLES_CONTAINER = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  flex-shrink: 0;
  width: 100%;
  padding: 8px 16px 4px 16px;
`;

const STYLES_NOTICE = css`
  display: inline-flex;
  align-items: flex-start;
  justify-content: space-between;
  overflow-wrap: break-word;
`;

const STYLES_SUBDUED = css`
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  padding-left: 8px;
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  background-size: cover;
  background-position: 50% 50%;
  height: 40px;
  width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
`;

const STYLES_RIGHT = css`
  padding-left: 8px;
  min-width: 15%;
  width: 100%;
`;

const STYLES_NOTICE_MESSAGE = css`
  line-height: 20px;
  font-size: 14px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  color: ${Constants.REFACTOR_COLORS.text};
`;

const STYLES_SUBDUED_MESSAGE = css`
  line-height: 20px;
  font-size: 14px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  font-style: italic;
  color: ${Constants.REFACTOR_COLORS.subdued};
`;

class NoticeMessage extends React.Component {
  render() {
    const { message } = this.props;

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_NOTICE}>
          <span className={STYLES_LEFT}>🏰</span>
          <span className={STYLES_RIGHT}>
            <ChatMessageHeader
              author="Castle"
              timestamp={this.props.message.timestamp}
              theme={this.props.theme}
            />
            <div className={STYLES_NOTICE_MESSAGE}>
              <UIMessageBody
                body={message.body}
                reactions={message.reactions}
                theme={this.props.theme}
                expandAttachments={false}
              />
            </div>
          </span>
        </div>
      </div>
    );
  }
}

class SubduedMessage extends React.Component {
  render() {
    const { message } = this.props;

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_SUBDUED}>
          <span className={STYLES_RIGHT}>
            <div className={STYLES_SUBDUED_MESSAGE}>
              <UIMessageBody
                body={message.body}
                reactions={message.reactions}
                theme={this.props.theme}
                expandAttachments={false}
              />
            </div>
          </span>
        </div>
      </div>
    );
  }
}

export default class ChatEventElement extends React.Component {
  static defaultProps = {
    user: {
      name: 'Castle',
      photo: {
        url: null,
      },
    },
  };

  render() {
    const { message, theme } = this.props;
    let type = message && message.body ? message.body.notificationType : null;
    if (theme && theme.hideEvents) {
      // TODO: hack to make sure the large notices don't overflow the left game sidebar
      type = 'subdued';
    }
    switch (type) {
      case 'game-session':
        return <NoticeMessage {...this.props} />;
      case 'joined-castle':
      case 'closed-game-session':
      default:
        return <SubduedMessage {...this.props} />;
    }
  }
}
