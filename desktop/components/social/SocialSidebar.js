import * as React from 'react';
import * as Constants from '~/common/constants';
import * as ChatUtilities from '~/common/chat-utilities';

import { css } from 'react-emotion';

import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';
import { ChatContext } from '~/contexts/ChatContext';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatChannel from '~/components/chat/ChatChannel';
import ChatMembers from '~/components/chat/ChatMembers';
import NotificationsList from '~/components/notifications/NotificationsList';
import SocialSidebarHeader from '~/components/social/SocialSidebarHeader';
import SocialSidebarNavigator from '~/components/social/SocialSidebarNavigator';

const STYLES_CONTAINER = css`
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  height: 100%;
`;

const STYLES_SIDEBAR_BODY = css`
  display: flex;
  width: 100%;
  height: 100%;
`;

const STYLES_CHANNEL_NAVIGATOR = css`
  width: ${Constants.sidebar.collapsedWidth};
  flex-shrink: 0;
  height: 100%;
`;

const STYLES_CHANNEL = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const THEME = {
  textColor: Constants.colors.white,
  background: `#191921`,
  anchorColor: Constants.colors.white,
  inputBackground: `#232324`,
  navigatorBackground: '#565656',
  navigatorSelectedBackground: '#343436',
  embedBorder: `none`,
  embedBackground: 'transparent',
  embedBoxShadow: `none`,
  embedPadding: `8px 8px 8px 8px`,
  embedWidth: '188px',
  actionItemColor: Constants.colors.white,
  actionItemBackground: '#232323',
  useNarrowModals: true, // emoji picker, etc. cannot overlap game window.
  reactionItemColor: Constants.colors.white,
  reactionItemBackground: '#232323',
  reactionItemSelectedBackground: '#230023',
};

class SocialSidebar extends React.Component {
  static defaultProps = {
    playing: {},
  };

  state = {
    mode: 'chat',
  };

  componentDidMount() {
    this._update();
  }

  componentDidUpdate(prevProps, prevState) {
    this._update(prevProps, prevState);
  }

  _update = (prevProps = {}, prevState = {}) => {
    const { chat, lobbyChannel, chatChannelId } = this.props;

    if (chat && lobbyChannel) {
      let channelIdVisible = this._getChannelIdVisible(this.props);
      let prevChannelIdVisible = this._getChannelIdVisible(prevProps);
      if (channelIdVisible !== prevChannelIdVisible) {
        chat.markChannelRead(channelIdVisible);
      }
    }
  };

  _getChannelIdVisible = (props) => {
    const { chatChannelId } = props;
    if (chatChannelId) {
      return chatChannelId;
    } else {
      const { lobbyChannel } = props;
      return lobbyChannel ? lobbyChannel.channelId : null;
    }
  };

  _handleNavigateToChat = async (channel, options) => {
    await this.setState({ mode: 'chat' });
    this.props.navigator.showChatChannel(channel.channelId, options);
  };

  _handleToggleMembers = () => {
    this.setState((state) => {
      return {
        ...state,
        mode: state.mode === 'chat' ? 'members' : 'chat',
      };
    });
  };

  _handleOpenDirectMessage = (user) => {
    this.props.chat.openChannelForUser(user);
    return this.setState({ mode: 'chat' });
  };

  _handleShowNotifications = () => {
    const { isChatExpanded } = this.props;
    if (!isChatExpanded) {
      this.props.navigator.toggleIsChatExpanded();
    }
    this.setState({ mode: 'notifications' });
  };

  _renderContent = (mode, { channelId, theme }) => {
    switch (mode) {
      case 'notifications':
        return <NotificationsList />;
      case 'members':
        const channel = this.props.chat.channels[channelId];
        const onlineUserIds = this.props.chat.channelOnlineUserIds[channelId];
        return (
          <ChatMembers
            userIds={onlineUserIds}
            onSendMessage={this._handleOpenDirectMessage}
            theme={theme}
          />
        );
      case 'chat':
      default:
        return (
          <div className={STYLES_CHANNEL}>
            {channelId && (
              <ChatChannel
                isSidebar
                chat={this.props.chat}
                numChannelMembers={this.props.chat.channelOnlineCounts[channelId]}
                onMembersClick={this._handleToggleMembers}
                channelId={channelId}
                size="24px"
                theme={theme}
              />
            )}
          </div>
        );
    }
  };

  render() {
    const { chat, viewer, userPresence, lobbyChannel } = this.props;
    const { playing, isChatExpanded, contentMode, gameMetaShown } = this.props;
    const channelId = this._getChannelIdVisible(this.props);
    let theme = playing.isVisible ? THEME : {};

    if (!viewer) {
      return null;
    }

    const sidebarWidth = isChatExpanded
      ? Constants.sidebar.width
      : Constants.sidebar.collapsedWidth;
    const borderLeft = isChatExpanded ? `1px solid #f3f3f3` : null;

    return (
      <div
        className={STYLES_CONTAINER}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          background: theme.background,
          borderLeft,
        }}>
        <SocialSidebarHeader
          mode={this.state.mode}
          channel={chat.channels[channelId]}
          isExpanded={isChatExpanded}
          numChannelMembers={chat.channelOnlineCounts[channelId]}
          onMembersClick={this._handleToggleMembers}
          viewer={viewer}
          onSelectNotifications={this._handleShowNotifications}
        />
        <div className={STYLES_SIDEBAR_BODY}>
          {isChatExpanded && this._renderContent(this.state.mode, { channelId, theme })}
          <div className={STYLES_CHANNEL_NAVIGATOR}>
            <SocialSidebarNavigator
              mode={this.state.mode}
              playing={playing}
              contentMode={contentMode}
              gameMetaShown={gameMetaShown}
              isChatExpanded={isChatExpanded}
              selectedChannelId={channelId}
              lobbyChannel={lobbyChannel}
              viewer={viewer}
              userPresence={userPresence}
              chat={chat}
              theme={theme}
              onSelectChannel={this._handleNavigateToChat}
              onToggleSidebar={this.props.navigator.toggleIsChatExpanded}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default class SocialSidebarWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => (
          <ChatContext.Consumer>
            {(chat) => (
              <UserPresenceContext.Consumer>
                {(userPresence) => (
                  <NavigatorContext.Consumer>
                    {(navigator) => (
                      <NavigationContext.Consumer>
                        {(navigation) => {
                          const lobbyChannel = chat.findChannel(
                            ChatUtilities.EVERYONE_CHANNEL_NAME
                          );
                          return (
                            <SocialSidebar
                              userPresence={userPresence}
                              viewer={currentUser.user}
                              isChatExpanded={navigation.isChatExpanded}
                              playing={navigation.playing}
                              contentMode={navigation.content.mode}
                              gameMetaShown={navigation.content.gameMetaShown}
                              chatChannelId={navigation.chatChannelId}
                              chat={chat}
                              lobbyChannel={lobbyChannel}
                              navigator={navigator}
                            />
                          );
                        }}
                      </NavigationContext.Consumer>
                    )}
                  </NavigatorContext.Consumer>
                )}
              </UserPresenceContext.Consumer>
            )}
          </ChatContext.Consumer>
        )}
      </CurrentUserContext.Consumer>
    );
  }
}
