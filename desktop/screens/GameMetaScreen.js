import * as React from 'react';
import * as Actions from '~/common/actions';
import * as ChatUtilities from '~/common/chat-utilities';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { ChatContext } from '~/contexts/ChatContext';
import { NavigatorContext, NavigationContext } from '~/contexts/NavigationContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatMembers from '~/components/chat/ChatMembers';
import GameMetaHeader from '~/components/gamemeta/GameMetaHeader';
import UIHorizontalNavigation from '~/components/reusable/UIHorizontalNavigation';

const STYLES_CONTAINER = css`
  width: 100%;
  min-width: 10
  background: ${Constants.colors.white};
  height: 100%;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;
`;

const STYLES_CONTENT_CONTAINER = css`
  width: 100%;
  padding: 16px 0;
`;

const STYLES_SETTING = css`
  span {
    color: magenta;
    text-decoration: underline;
    cursor: pointer;
  }
`;

class GameMetaScreen extends React.Component {
  state = {
    mode: 'members',
    channel: null,
  };

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, prevState);
  }

  componentDidMount() {
    this._mounted = true;
    this._update(null, null);
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  _update = async (prevProps, prevState) => {
    const { chat, game } = this.props;
    if (!prevProps || prevProps.game !== game) {
      // clear prev state
      let updates = { mode: 'members' };
      if (this.state.channel) {
        updates.channel = null;
      }
      await this.setState(updates);
      let channel;
      if (chat) {
        channel = chat.findChannelForGame(game);
      }
      if (channel && channel.type === 'game' && channel.gameId) {
        chat.markChannelRead(channel.channelId);
        this.setState({ channel });
      }
    }
  };

  _getNavigationItems = () => {
    const { chat, game } = this.props;
    const { channel } = this.state;
    let items = [];
    if (channel) {
      const numChannelMembers = chat.channelOnlineCounts[channel.channelId];
      items.push({ label: `People Online (${numChannelMembers})`, key: 'members' });
      if (channel.isSubscribed) {
        items.push({ label: 'Settings', key: 'settings' });
      }
    }

    return items;
  };

  _handleNavigationChange = (selectedKey) => {
    this.setState({ mode: selectedKey });
  };

  _handleLeaveChannel = async () => {
    // TODO: BEN: clean up
    if (this.state.channel) {
      const lobbyChannel = this.props.chat.findChannel(ChatUtilities.EVERYONE_CHANNEL_NAME);
      await this.props.navigator.showChatChannel(lobbyChannel.channelId);
      this.props.chat.closeChannel(this.state.channel.channelId);
    }
    this.props.navigator.navigateToHome();
  };

  _handleOpenDirectMessage = (user) => {
    this.props.chat.openChannelForUser(user);
  };

  _renderContent = (channel, mode) => {
    switch (mode) {
      case 'settings':
        return (
          <div className={STYLES_CONTENT_CONTAINER}>
            <div className={STYLES_SETTING}>
              <span onClick={this._handleLeaveChannel}>Remove</span> this game from my Play menu
              shortcuts
            </div>
          </div>
        );
      case 'members':
      default:
        return (
          <ChatMembers
            userIds={channel.subscribedUsers.map((user) => user.userId)}
            onSendMessage={this._handleOpenDirectMessage}
          />
        );
    }
  };

  render() {
    const { channel, mode } = this.state;
    const { game } = this.props;

    // TODO: BEN
    if (!channel) return null;

    return (
      <div className={STYLES_CONTAINER}>
        <div
          className={css`
            width: 768px;
            max-width: 768px;
            margin-top: 24px;
          `}>
          <GameMetaHeader
            game={game}
            onSelectGame={this.props.navigator.navigateToGame}
            onSelectUser={this.props.navigator.navigateToUserProfile}
            onLeaveChannel={this._handleLeaveChannel}
          />
          <div
            className={css`
              display: block;
              width: 100%;
            `}>
            <UIHorizontalNavigation
              items={this._getNavigationItems()}
              onChange={this._handleNavigationChange}
              selectedKey={mode}
              style={{ borderBottom: `2px solid #ececec`, width: '100%' }}
            />
            {this._renderContent(channel, mode)}
          </div>
        </div>
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
                        game={navigation.gameMetaShown}
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
