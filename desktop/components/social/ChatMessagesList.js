import * as React from 'react';
import { css } from 'react-emotion';
import ChatMessage from '~/components/social/ChatMessage';

const STYLES_MESSAGES_CONTAINER = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_BOTTOM = css`
  height: 8px;
`;

export default class ChatMessagesList extends React.Component {
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

  render() {
    let listItems = [];
    let prevUserId = null;
    for (let ii = 0, nn = this.props.messages.length; ii < nn; ii++) {
      let chatMessage = this.props.messages[ii];
      if (chatMessage.richMessage.message) {
        listItems.push(
          <ChatMessage
            key={chatMessage.key}
            message={chatMessage}
            prevUserId={prevUserId}
            navigateToUserProfile={this.props.navigateToUserProfile}
          />
        );
        prevUserId = chatMessage.userId;
      }
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
