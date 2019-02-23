import * as React from 'react';
import { css } from 'react-emotion';
import { SocialContext } from '~/contexts/SocialContext';
import Linkify from 'react-linkify';
import { getEmojiComponent } from '~/common/emojis';
import UIAvatar from '~/components/reusable/UIAvatar';

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
  font-weight: 800;
  cursor: pointer;
  padding-bottom: 2px;
`;

const STYLES_MESSAGE_TIME = css`
  padding-left: 10px;
  font-weight: 100;
  font-size: 0.8rem;
  color: #666;
`;

const STYLES_MESSAGE = css`
  padding: 4px 0 4px 32px;
  overflow-wrap: break-word;
  float: 'left';
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
    let result = [];
    for (let i = 0; i < message.length; i++) {
      let messagePart = message[i];
      if (messagePart.text) {
        result.push(<span key={i}>{messagePart.text}</span>);
      } else if (messagePart.userId) {
        let isRealUser = !!this.props.social.userIdToUser[messagePart.userId];
        let user = this.props.social.userIdToUser[messagePart.userId] || {
          userId: messagePart.userId,
          username: messagePart.userId,
        };

        result.push(
          <span
            key={i}
            className={STYLES_MESSAGE_TAG}
            onClick={isRealUser ? () => this.props.navigateToUserProfile(user) : null}>{`@${
            user.username
          }`}</span>
        );
      } else if (messagePart.emoji) {
        result.push(<span key={i}>{getEmojiComponent(messagePart.emoji, 16)}</span>);
      }
    }

    return result;
  };

  _areDatesSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  render() {
    let listItems = [];
    let prevUserId = null;
    for (let ii = 0, nn = this.props.messages.length; ii < nn; ii++) {
      // TODO: show UIAvatar on the left along with author name.
      const chatMessage = this.props.messages[ii];
      const userId = chatMessage.userId;
      let maybeAvatar = <div style={{ width: 24, marginRight: 8, float: 'left' }} />;
      let maybeUsername = null;
      if (!prevUserId || prevUserId !== userId) {
        let isRealUser = !!this.props.social.userIdToUser[chatMessage.userId];
        let user = this.props.social.userIdToUser[chatMessage.userId] || {
          userId: chatMessage.userId,
          username: chatMessage.userId,
        };

        if (chatMessage.userId === NOTIFICATIONS_USER_ID) {
          user = { userId: NOTIFICATIONS_USER_ID, username: 'Castle' };
        }

        if (user.photo && user.photo.url) {
          maybeAvatar = (
            <UIAvatar
              src={user.photo.url}
              style={{
                width: 24,
                height: 24,
                marginRight: 8,
                marginTop: 8,
                float: 'left',
              }}
            />
          );
        }

        let date = new Date(chatMessage.timestamp);
        let timeString = date.toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });

        if (!this._areDatesSameDay(new Date(), date)) {
          let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

          if (this._areDatesSameDay(yesterday, date)) {
            timeString = `Yesterday at ${timeString}`;
          } else {
            timeString = `${date.toLocaleString('en-us', {
              month: 'short',
            })} ${date.getDate()} at ${timeString}`;
          }
        }

        maybeUsername = (
          <div onClick={isRealUser ? () => this.props.navigateToUserProfile(user) : null}>
            <div className={STYLES_MESSAGE_USERNAME}>
              {user.username}
              <span className={STYLES_MESSAGE_TIME}>{timeString}</span>
            </div>
          </div>
        );
      }
      listItems.push(
        <div key={chatMessage.key} className={STYLES_CHAT_ITEM}>
          {maybeAvatar}
          <div className={STYLES_MESSAGE}>
            {maybeUsername}
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
