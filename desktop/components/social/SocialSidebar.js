import * as React from 'react';
import * as Constants from '~/common/constants';
import * as ChatUtilities from '~/common/chat-utilities';

import { css } from 'react-emotion';

import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';
import { ChatContext } from '~/contexts/ChatContext';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { UserPresenceContext } from '~/contexts/UserPresenceContext';

import ChatChannel from '~/components/chat/ChatChannel';
import SocialSidebarHeader from '~/components/social/SocialSidebarHeader';
import SocialSidebarNavigator from '~/components/social/SocialSidebarNavigator';

const STYLES_CONTAINER = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  height: 100%;
  border-left: 1px solid #f3f3f3;
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

class SocialSidebar extends React.Component {
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

  _handleNavigateToChat = async (channel) => {
    this.props.navigator.showChatChannel(channel.channelId);
  };

  render() {
    const { chat, viewer, userPresence, isChatExpanded, gameMetaChannelId } = this.props;
    const channelId = this._getChannelIdVisible(this.props);

    if (!viewer) {
      return null;
    }

    const sidebarWidth = isChatExpanded
      ? Constants.sidebar.width
      : Constants.sidebar.collapsedWidth;

    return (
      <div className={STYLES_CONTAINER} style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        <SocialSidebarHeader
          channel={chat.channels[channelId]}
          isExpanded={isChatExpanded}
          onToggleSidebar={this.props.navigator.toggleIsChatExpanded}
        />
        <div className={STYLES_SIDEBAR_BODY}>
          {isChatExpanded && (
            <div className={STYLES_CHANNEL}>
              {channelId && (
                <ChatChannel isSidebar chat={this.props.chat} channelId={channelId} size="24px" />
              )}
            </div>
          )}
          <div className={STYLES_CHANNEL_NAVIGATOR}>
            <SocialSidebarNavigator
              isChatExpanded={isChatExpanded}
              selectedChannelId={channelId}
              viewer={viewer}
              userPresence={userPresence}
              gameMetaChannelId={gameMetaChannelId}
              chat={chat}
              onSelectChannel={this._handleNavigateToChat}
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
                              gameMetaChannelId={navigation.gameMetaChannelId}
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
