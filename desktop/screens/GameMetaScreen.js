import * as React from 'react';
import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import { ChatContext } from '~/contexts/ChatContext';
import { NavigatorContext, NavigationContext } from '~/contexts/NavigationContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatChannel from '~/components/chat/ChatChannel';
import ChatMembers from '~/components/chat/ChatMembers';
import GameMetaHeader from '~/components/gamemeta/GameMetaHeader';
import UIHorizontalNavigation from '~/components/reusable/UIHorizontalNavigation';

const STYLES_CONTAINER = css`
  width: 100%;
  min-width: 10
  background: ${Constants.colors.white};
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
`;

class GameMetaScreen extends React.Component {
  state = {
    game: null,
    mode: 'chat',
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
    const { chat, channelId } = this.props;
    if (chat) {
      chat.markChannelRead(channelId);
    }
    if (!prevProps || prevProps.channelId !== channelId) {
      this._mounted && this.setState({ mode: 'chat', messageIdToEdit: null });
      const channel = chat.channels[channelId];
      if (channel.type === 'game' && channel.gameId) {
        try {
          let game = await Actions.getGameByGameId(channel.gameId);
          this.setState({ game });
        } catch (_) {}
      }
    }
  };

  _getNavigationItems = () => {
    let items = [{ label: 'Chat', key: 'chat' }];
    const numChannelMembers = this.props.chat.channelOnlineCounts[this.props.channelId];
    if (numChannelMembers > 0) {
      items.push({ label: `People Online (${numChannelMembers})`, key: 'members' });
    }
    return items;
  };

  _handleNavigationChange = (selectedKey) => {
    this.setState({ mode: selectedKey });
  };

  _handleLeaveChannel = async () => {
    this.props.chat.closeChannel(this.props.channelId);
    this.props.navigator.navigateToHome();
  };

  _handleOpenDirectMessage = (user) => {
    this.props.chat.openChannelForUser(user);
  };

  _renderContent = (channel, mode) => {
    switch (mode) {
      case 'members':
        return (
          <ChatMembers
            userIds={channel.subscribedUsers.map((user) => user.userId)}
            onSendMessage={this._handleOpenDirectMessage}
          />
        );
      case 'chat':
      default:
        return <ChatChannel chat={this.props.chat} channelId={this.props.channelId} />;
    }
  };

  render() {
    const { game, mode } = this.state;

    if (!this.props.channelId) {
      return null;
    }

    const channel = this.props.chat.channels[this.props.channelId];

    return (
      <div className={STYLES_CONTAINER}>
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
            style={{ borderBottom: `1px solid #ececec`, width: '100%' }}
          />
        </div>
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
