import * as React from 'react';
import { css } from 'react-emotion';
import { SocialContext } from '~/contexts/SocialContext';
import Linkify from 'react-linkify';

import * as Constants from '~/common/constants';

const NOTIFICATIONS_USER_ID = -1;

const STYLES_MESSAGES_CONTAINER = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_CHAT_ITEM = css`
  padding: 0 8px 0 8px;
  font-size: 0.9rem;
  line-height: ${Constants.linescale.lvl7};
  cursor: default;

  :hover {
    background: ${Constants.colors.background4};
  }
`;

const STYLES_MESSAGE_USERNAME = css`
  padding-top: 8px;
  font-weight: 800;
  cursor: pointer;
`;

const STYLES_MESSAGE = css`
  padding: 4px 0 4px 16px;
  overflow-wrap: break-word;
`;

const STYLES_MESSAGE_TAG = css`
  cursor: pointer;
  font-weight: 900;
  background: #feff00;
`;

const STYLES_BOTTOM = css`
  height: 8px;
`;

class ChatMessagesList extends React.Component {
  _container;
  _containerBottom;

  componentWillReceiveProps(nextProps) {
    const isBottom =
      this._container.scrollHeight - this._container.scrollTop === this._container.clientHeight;
    const hasMoreMessages = nextProps.messages.length > this.props.messages.length;

    if (isBottom && hasMoreMessages) {
      this.scroll();
    }
  }

  componentDidMount() {
    this.scroll();
  }

  scroll = () => {
    window.setTimeout(() => {
      if (this._containerBottom) {
        this._containerBottom.scrollIntoView(false);
      }
    });
  };

  _renderChatMessage = (message) => {
    return message.map((messagePart) => {
      if (messagePart.text) {
        return <span>{messagePart.text}</span>;
      } else if (messagePart.userId) {
        let isRealUser = !!this.props.social.userIdToUser[messagePart.userId];
        let user = this.props.social.userIdToUser[messagePart.userId] || {
          userId: messagePart.userId,
          username: messagePart.userId,
        };

        return (
          <span
            className={STYLES_MESSAGE_TAG}
            onClick={isRealUser ? () => this.props.navigateToUserProfile(user) : null}>{`@${
            user.username
          }`}</span>
        );
      }
    });
  };

  render() {
    let listItems = [];
    let prevUserId = null;
    for (let ii = 0, nn = this.props.messages.length; ii < nn; ii++) {
      // TODO: show UIAvatar on the left along with author name.
      const chatMessage = this.props.messages[ii];
      const userId = chatMessage.userId;
      let maybeUsername;
      if (!prevUserId || prevUserId !== userId) {
        let isRealUser = !!this.props.social.userIdToUser[chatMessage.userId];
        let user = this.props.social.userIdToUser[chatMessage.userId] || {
          userId: chatMessage.userId,
          username: chatMessage.userId,
        };

        if (chatMessage.userId === NOTIFICATIONS_USER_ID) {
          user = { userId: NOTIFICATIONS_USER_ID, username: 'Castle' };
        }

        maybeUsername = (
          <div
            className={STYLES_MESSAGE_USERNAME}
            onClick={isRealUser ? () => this.props.navigateToUserProfile(user) : null}>
            {user.username}
          </div>
        );
      }
      listItems.push(
        <div key={chatMessage.key} className={STYLES_CHAT_ITEM}>
          {maybeUsername}
          <div className={STYLES_MESSAGE}>
            <Linkify>{this._renderChatMessage(chatMessage.message)}</Linkify>
          </div>
        </div>
      );
      prevUserId = userId;
    }
    return (
      <div
        className={STYLES_MESSAGES_CONTAINER}
        ref={(c) => {
          this._container = c;
        }}>
        {listItems}
        <div
          className={STYLES_BOTTOM}
          ref={(c) => {
            this._containerBottom = c;
            this.scroll();
          }}
        />
      </div>
    );
  }
}

export default class ChatMessagesListWithContext extends React.Component {
  render() {
    return (
      <SocialContext.Consumer>
        {(social) => <ChatMessagesList {...this.props} social={social} />}
      </SocialContext.Consumer>
    );
  }
}
