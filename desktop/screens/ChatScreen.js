import * as React from 'react';
import * as Actions from '~/common/actions';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';
import * as ChatActions from '~/common/actions-chat';
import * as Emojis from '~/common/emojis';
import * as NativeUtil from '~/native/nativeutil';
import * as SVG from '~/components/primitives/svg';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';
import { NavigatorContext, NavigationContext } from '~/contexts/NavigationContext';
import { ChatContext } from '~/contexts/ChatContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import regexMatch from 'react-string-replace';
import ChatHeader from '~/components/chat/ChatHeader';
import ChatMessages from '~/components/chat/ChatMessages';
import ChatMembers from '~/components/chat/ChatMembers';
import ChatInputControl from '~/components/chat/ChatInputControl';
import ChatOptions from '~/components/chat/ChatOptions';

const DIRECT_MESSAGE_PREFIX = 'dm-';

const STYLES_CONTAINER_BASE = `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  min-width: 10%;
  height: 100vh;
  transition: 0ms ease all;
  transition-property: transform, opacity;
  background: ${Constants.colors.white};
`;

const STYLES_CONTAINER = css`
  ${STYLES_CONTAINER_BASE};
  transform: translateX(0px);
  opacity: 1;
`;

class ChatScreen extends React.Component {
  _timeout;

  state = {
    value: '',
    autocomplete: {
      type: null,
    },
    mode: 'MESSAGES',
  };

  constructor(props) {
    super(props);
    this._update(null, null);
  }

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, prevState);
  }

  _update = (prevProps, prevState) => {
    const { chat, channelId } = this.props;
    if (chat) {
      chat.markChannelRead(channelId);
    }
    if (prevProps && prevProps.channelId !== channelId) {
      this.setState({ mode: 'MESSAGES' });
    }
  };

  componentWillUnmount() {
    this.clear();
  }

  clear = () => {
    window.clearTimeout(this._timeout);
    this._timeout = null;
  };

  _handleClickChannelName = () => {
    if (this.state.mode !== 'MESSAGES') {
      this.setState({ mode: 'MESSAGES' });
    } else {
      const channel = this.props.chat.channels[this.props.channelId];
      if (channel.type === 'dm') {
        const user = this.props.userPresence.userIdToUser[channel.otherUserId];
        if (user) {
          this.props.navigator.navigateToUserProfile(user);
        }
      }
    }
  };

  _handleLeaveChannel = async () => {
    this.props.chat.closeChannel(this.props.channelId);
    this.props.navigator.navigateToHome();
  };

  _handleShowSingleChannelMembers = () => this.setState({ mode: 'MEMBERS' });

  _handleForceChange = (valueState) => {
    this.setState(valueState);
  };

  _handleChange = (e) => {
    const value = e.target.value;
    this.setState({ [e.target.name]: value }, () => {
      let autocompleteType, query;
      regexMatch(value, /([@][\w_-]+)$/g, (match, i) => {
        if (!autocompleteType) {
          autocompleteType = 'users';
          query = match;
        }
        return match;
      });
      regexMatch(value, /[:]([\w_\-\+]+)$/g, (match, i) => {
        if (!autocompleteType) {
          autocompleteType = 'emoji';
          query = match;
        }
        return match;
      });

      if (autocompleteType) {
        this._handleSearch(query, autocompleteType);
      } else {
        window.clearTimeout(this._timeout);
        this._timeout = null;
        return this.setState({
          autocomplete: {
            type: null,
          },
        });
      }
    });
  };

  _handleSearch = (value, type) => {
    let callback,
      isNetworkRequest = false;
    if (type === 'users') {
      isNetworkRequest = true;
      callback = async () => {
        let users = [];
        let autocompleteResults = await ChatActions.getAutocompleteAsync(value, ['users']);
        if (autocompleteResults.users) {
          users = autocompleteResults.users;
        }
        this.props.userPresence.addUsers(users);
        this.setState({
          autocomplete: {
            type: 'users',
            users,
          },
        });
      };
    } else if (type === 'emoji') {
      callback = () => {
        let emoji = Emojis.autocompleteShortNames(value);
        this.setState({
          autocomplete: {
            type: 'emoji',
            emoji,
          },
        });
      };
    }
    window.clearTimeout(this._timeout);
    this._timeout = null;
    if (isNetworkRequest) {
      this._timeout = window.setTimeout(callback, 200);
    } else {
      callback();
    }
  };

  _handleKeyDown = (e) => {
    if (e.which === 13 && !e.shiftKey) {
      event.preventDefault();

      if (Strings.isEmpty(this.state.value.trim())) {
        return;
      }
      this.props.chat.sendMessage(this.props.channelId, this.state.value);
      this.clear();
      this.setState({ value: '', autocomplete: { type: null } });
    }
  };

  _renderContent = (channel, mode) => {
    const { userPresence } = this.props;

    switch (mode) {
      case 'MEMBERS':
        return <ChatMembers userIds={channel.subscribedUsers.map((user) => user.userId)} />;
      default:
        return (
          <React.Fragment>
            <ChatMessages
              messages={channel.messages}
              navigator={this.props.navigator}
              userIdToUser={userPresence.userIdToUser}
            />
            <ChatInputControl
              value={this.state.value}
              name="value"
              autocomplete={this.state.autocomplete}
              placeholder="Type a message"
              onChange={this._handleChange}
              onKeyDown={this._handleKeyDown}
              onForceChange={this._handleForceChange}
            />
          </React.Fragment>
        );
    }
  };
  render() {
    const { mode } = this.state;

    if (!this.props.channelId) {
      return null;
    }

    const channel = this.props.chat.channels[this.props.channelId];
    let onLeaveChannel, numChannelMembers;
    if (!(channel.name === ChatUtilities.EVERYONE_CHANNEL_NAME && channel.type === 'public')) {
      // caint leave the lobby
      onLeaveChannel = this._handleLeaveChannel;
    }
    if (channel.type !== 'dm') {
      // don't show online counts for a 2 person dm thread
      numChannelMembers = this.props.chat.channelOnlineCounts[this.props.channelId];
    }

    return (
      <div className={STYLES_CONTAINER}>
        <ChatHeader
          channel={channel}
          mode={mode}
          numChannelMembers={numChannelMembers}
          onSelectGame={this.props.navigator.navigateToGame}
          onLeaveChannel={onLeaveChannel}
          onMembersClick={this._handleShowSingleChannelMembers}
          onChannelClick={this._handleClickChannelName}
        />
        {this._renderContent(channel, mode)}
      </div>
    );
  }
}

export default class ChatScreenWithContext extends React.Component {
  render() {
    return (
      <UserPresenceContext.Consumer>
        {(userPresence) => (
          <ChatContext.Consumer>
            {(chat) => (
              <NavigationContext.Consumer>
                {(navigation) => (
                  <NavigatorContext.Consumer>
                    {(navigator) => (
                      <ChatScreen
                        navigator={navigator}
                        channelId={navigation.chatChannelId}
                        userPresence={userPresence}
                        chat={chat}
                      />
                    )}
                  </NavigatorContext.Consumer>
                )}
              </NavigationContext.Consumer>
            )}
          </ChatContext.Consumer>
        )}
      </UserPresenceContext.Consumer>
    );
  }
}
