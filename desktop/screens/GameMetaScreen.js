import * as React from 'react';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { ChatContext } from '~/contexts/ChatContext';
import { NavigatorContext, NavigationContext } from '~/contexts/NavigationContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatChannel from '~/components/chat/ChatChannel';
import ChatMembers from '~/components/chat/ChatMembers';
import GameMetaHeader from '~/components/gamemeta/GameMetaHeader';

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

class GameMetaScreen extends React.Component {
  state = {
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
      this.setState({ mode: 'MESSAGES', messageIdToEdit: null });
    }
  };

  _handleClickChannelName = () => {
    if (this.state.mode !== 'MESSAGES') {
      this.setState({ mode: 'MESSAGES' });
    } else {
      const channel = this.props.chat.channels[this.props.channelId];
      if (channel.type === 'dm') {
        const user = this.props.userIdToUser[channel.otherUserId];
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

  _handleOpenDirectMessage = (user) => {
    this.props.chat.openChannelForUser(user);
  };

  _renderContent = (channel, mode) => {
    switch (mode) {
      case 'MEMBERS':
        return (
          <ChatMembers
            userIds={channel.subscribedUsers.map((user) => user.userId)}
            onSendMessage={this._handleOpenDirectMessage}
          />
        );
      default:
        return <ChatChannel chat={this.props.chat} channelId={this.props.channelId} />;
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
        <GameMetaHeader
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

export default class GameMetaScreenWithContext extends React.Component {
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
                      <GameMetaScreen
                        navigator={navigator}
                        channelId={navigation.chatChannelId}
                        userIdToUser={userPresence.userIdToUser}
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
