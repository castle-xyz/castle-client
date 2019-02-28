import * as React from 'react';
import * as Actions from '~/common/actions';
import * as ChatUtils from '~/common/chatutils';
import { NativeBinds } from '~/native/nativebinds';

import { css } from 'react-emotion';

import { CastleChat, ConnectionStatus } from 'castle-chat-lib';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { SocialContext } from '~/contexts/SocialContext';
import { NavigatorContext } from '~/contexts/NavigationContext';
import ChatInput from '~/components/social/ChatInput';
import ChatMessagesList from '~/components/social/ChatMessagesList';
import UIButton from '~/components/reusable/UIButton';

const STYLES_CONTAINER = css`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
`;

const STYLES_CONNECTING = css`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: flex-start;
  padding: 32px 16px 16px 16px;
  flex-direction: column;
`;

const ROOM_NAME = 'general';
const NOTIFICATIONS_USER_ID = -1;
const TEST_MESSAGE = null;

class ChatContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      chatMessages: [],
      onlineUsers: [],
      connectionStatus: ConnectionStatus.CONNECTING,
    };

    this._handleMessagesLock = false;
  }

  componentWillMount() {
    this._startChatAsync();
    window.addEventListener('CASTLE_ADD_CHAT_NOTIFICATION', this._addChatNotificationAsync);
  }

  componentWillUnmount() {
    window.removeEventListener('CASTLE_ADD_CHAT_NOTIFICATION', this._addChatNotificationAsync);
  }

  _addChatNotificationAsync = async (event) => {
    await this._acquireLockAsync();

    this.setState((state) => {
      state.chatMessages.push({
        richMessage: { message: [{ text: event.params.message }] },
        roomName: ROOM_NAME,
        userId: NOTIFICATIONS_USER_ID,
        timestamp: new Date().toString(),
        key: Math.random(),
      });

      state.chatMessages.sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      this._releaseLock();

      return {
        chatMessages: state.chatMessages,
      };
    });
  };

  _startChatAsync = async () => {
    const userId = this.props.currentUserId;
    if (!userId) {
      throw new Error('Cannot start chat without a logged in userId');
    }

    let token = await Actions.getAccessTokenAsync();
    if (!token) {
      throw new Error('Cannot start chat without an access token');
    }

    this._castleChat = new CastleChat();
    this._castleChat.init('http://chat.castle.games:5280/http-bind/', userId, token, [ROOM_NAME]);
    this._castleChat.setOnMessagesHandler(this._handleMessagesAsync);
    this._castleChat.setOnPresenceHandler(this._handlePresenceAsync);
    this._castleChat.setConnectionStatusHandler((status) => {
      this.setState({ connectionStatus: status });

      if (status === ConnectionStatus.DISCONNECTED) {
        this.setState({
          chatMessages: [],
          onlineUsers: [],
        });

        this.props.social.setOnlineUserIds({});
      }
    });
    this._castleChat.connect();
  };

  _sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  _getUserForId = (userId) => {
    if (userId == 'admin') {
      return {
        userId: 'admin',
        username: 'admin',
      };
    }

    return this.props.social.userIdToUser[userId];
  };

  _acquireLockAsync = async () => {
    while (this._handleMessagesLock) {
      await this._sleep(100);
    }
    this._handleMessagesLock = true;
  };

  _releaseLock = () => {
    this._handleMessagesLock = false;
  };

  _triggerLocalNotifications = (messages) => {
    for (let i = 0; i < messages.length; i++) {
      let message = messages[i];

      let title = 'Castle Chat';
      let fromUserId = message.message.name;
      if (this.props.social.userIdToUser[fromUserId]) {
        title = `${title} from @${this.props.social.userIdToUser[fromUserId].username}`;
      }

      NativeBinds.showDesktopNotification({
        title,
        body: ChatUtils.messageToString(message, this.props.social),
      });
    }
  };

  _handleMessagesAsync = async (messages) => {
    if (TEST_MESSAGE) {
      messages.push({
        message: {
          name: '1',
          body: TEST_MESSAGE,
        },
        roomName: ROOM_NAME,
        timestamp: new Date().toString(),
      });
    }

    // load all users first
    let userIdsToLoad = {};
    let localNotifications = [];
    for (let i = 0; i < messages.length; i++) {
      let fromUserId = messages[i].message.name;
      let fromUser = this._getUserForId(fromUserId);
      if (!fromUser) {
        userIdsToLoad[fromUserId] = true;
      }

      messages[i].richMessage = ChatUtils.convertToRichMessage(messages[i].message.body);
      if (messages[i].richMessage.message) {
        for (let j = 0; j < messages[i].richMessage.message.length; j++) {
          let richMessagePart = messages[i].richMessage.message[j];
          if (richMessagePart.userId) {
            let fromUser = this._getUserForId(richMessagePart.userId);
            if (!fromUser) {
              userIdsToLoad[richMessagePart.userId] = true;
            }

            if (richMessagePart.userId === this.props.currentUserId && !messages[i].message.delay) {
              localNotifications.push(messages[i]);
            }
          }
        }
      }
    }

    try {
      let users = await Actions.getUsers({ userIds: _.keys(userIdsToLoad) });
      await this.props.social.addUsers(users);
    } catch (e) {}

    if (localNotifications.length > 0) {
      this._triggerLocalNotifications(localNotifications);
    }

    await this._acquireLockAsync();

    this.setState((state) => {
      for (let i = 0; i < messages.length; i++) {
        let msg = messages[i];
        let roomName = msg.roomName;
        let fromUserId = msg.message.name;
        let richMessage = msg.richMessage;
        let timestamp = msg.timestamp;

        if (richMessage) {
          state.chatMessages.push({
            key: Math.random(),
            userId: fromUserId,
            richMessage,
            roomName,
            timestamp,
          });
        }
      }

      state.chatMessages.sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      this._releaseLock();
      return {
        chatMessages: state.chatMessages,
      };
    });
  };

  _handlePresenceAsync = async (event) => {
    if (event.roomName === ROOM_NAME) {
      this.setState({ onlineUsers: event.roster.map((user) => user.name) });

      let onlineUsersMap = {};
      event.roster.forEach((user) => {
        onlineUsersMap[user.name] = true;
      });
      this.props.social.setOnlineUserIds(onlineUsersMap);
    }
  };

  _onSubmit = (message) => {
    if (this._castleChat) {
      this._castleChat.sendMessageAsync(ROOM_NAME, message);
    }
  };

  _onClickConnect = () => {
    this._castleChat.connect();
  };

  _renderContent() {
    switch (this.state.connectionStatus) {
      case ConnectionStatus.CONNECTED:
        if (this.state.chatMessages.length == 0) {
          // TODO: this is a little buggy in that when the server is restarted there won't be any messages sent back
          // Fix this by actually requesting history every time chat opens
          return <div className={STYLES_CONNECTING}>Loading messages...</div>;
        } else {
          return (
            <ChatMessagesList
              messages={this.state.chatMessages}
              navigateToUserProfile={this.props.navigateToUserProfile}
            />
          );
        }
      case ConnectionStatus.CONNECTING:
        return <div className={STYLES_CONNECTING}>Global chat is connecting...</div>;
      case ConnectionStatus.DISCONNECTED:
        return (
          <div className={STYLES_CONNECTING}>
            <p style={{ marginBottom: 16 }}>Global chat is not connected.</p>
            <UIButton onClick={this._onClickConnect}>Reconnect</UIButton>
          </div>
        );
    }
  }

  render() {
    const readOnly = this.state.connectionStatus !== ConnectionStatus.CONNECTED;
    const placeholder = readOnly ? '' : 'Type here to chat...';
    return (
      <React.Fragment>
        <div className={STYLES_CONTAINER}>{this._renderContent()}</div>
        <ChatInput onSubmit={this._onSubmit} readOnly={readOnly} placeholder={placeholder} />
      </React.Fragment>
    );
  }
}

export default class ChatContainerWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => {
          const currentUserId = currentUser.user ? currentUser.user.userId : null;
          return (
            <SocialContext.Consumer>
              {(social) => (
                <NavigatorContext.Consumer>
                  {(navigator) => (
                    <ChatContainer
                      currentUserId={currentUserId}
                      social={social}
                      navigateToUserProfile={navigator.navigateToUserProfile}
                    />
                  )}
                </NavigatorContext.Consumer>
              )}
            </SocialContext.Consumer>
          );
        }}
      </CurrentUserContext.Consumer>
    );
  }
}
