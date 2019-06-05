import * as React from 'react';
import * as SVG from '~/common/svg';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';

import { css } from 'react-emotion';

import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { SocialContext } from '~/contexts/SocialContext';
import { NavigatorContext, NavigationContext } from '~/contexts/NavigationContext';
import { ChatSessionContext } from '~/contexts/ChatSessionContext';

import SidebarOptions from '~/components/sidebar/SidebarOptions';
import SidebarOptionsChannels from '~/components/sidebar/SidebarOptionsChannels';
import SidebarOptionsMessages from '~/components/sidebar/SidebarOptionsMessages';

import SidebarHeader from '~/components/sidebar/SidebarHeader';
import SidebarChannels from '~/components/sidebar/SidebarChannels';
import SidebarDirectMessages from '~/components/sidebar/SidebarDirectMessages';
import SidebarNavigation from '~/components/sidebar/SidebarNavigation';

const STYLES_CONTAINER = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-direction: column;
  width: 228px;
  min-width: 10%;
  height: 100vh;
  transition: 200ms ease width;
`;

const STYLES_SIDEBAR = css`
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  background: ${Constants.REFACTOR_COLORS.elements.channels};
  overflow-y: scroll;
  overflow-wrap: break-word;

  ::-webkit-scrollbar {
    display: none;
  }
`;

class Sidebar extends React.Component {
  state = {
    value: '',
    mode: 'DEFAULT',
  };

  _handleSignIn = () => {
    return this.props.navigator.navigateToSignIn();
  };

  _handleSignOut = () => {
    this.props.currentUser.clearCurrentUser();

    this.setState({ mode: 'DEFAULT' });
  };

  _handleNavigateToChat = (channel) => {
    this.props.chat.handleConnect(channel);
    return this.props.navigator.navigateToChat();
  };

  _handleNavigateToMakeGame = () => {
    return this.props.navigator.navigateToCreate();
  };

  _handleNavigateToFeaturedGames = () => {
    return this.props.navigator.navigateToContentMode('featured');
  };

  _handleNavigateToAllPosts = () => {
    return this.props.navigator.navigateToContentMode('posts');
  };

  _handleNavigateToHistory = () => {
    return this.props.navigator.navigateToContentMode('history');
  };

  _handleShowOptions = () => this.setState({ mode: 'OPTIONS' });

  _handleShowChannelOptions = () => this.setState({ mode: 'OPTIONS_CHANNELS' });

  _handleShowDirectMessageOptions = () => this.setState({ mode: 'OPTIONS_MESSAGES' });

  _handleHideOptions = () => this.setState({ mode: 'DEFAULT' });

  _renderRootSidebar = () => {
    const { navigation, navigator, viewer, social, chat } = this.props;
    const isChatVisible = navigation.contentMode === 'chat';

    return (
      <div className={STYLES_SIDEBAR}>
        <SidebarHeader
          viewer={viewer}
          navigator={navigator}
          onShowOptions={this._handleShowOptions}
          onSignIn={this._handleSignIn}
          onSignOut={this._handleSignOut}
          onHideSidebar={this._handleHideSidebar}
        />
        <SidebarNavigation
          viewer={viewer}
          contentMode={navigation.contentMode}
          onNavigateToMakeGame={this._handleNavigateToMakeGame}
          onNavigateToFeaturedGames={this._handleNavigateToFeaturedGames}
          onNavigateToAllPosts={this._handleNavigateToAllPosts}
          onNavigateToHistory={this._handleNavigateToHistory}
        />
        {viewer ? (
          <SidebarChannels
            selectedChannelId={chat.channel ? chat.channel.channelId : null}
            viewer={viewer}
            contentMode={navigation.contentMode}
            isChatVisible={isChatVisible}
            channels={social.allChatChannels}
            onShowOptions={this._handleShowChannelOptions}
            onSelectChannel={this._handleNavigateToChat}
          />
        ) : null}
        {viewer && this.props.social.allMessageChannels ? (
          <SidebarDirectMessages
            viewer={viewer}
            isChatVisible={isChatVisible}
            onShowOptions={this._handleShowDirectMessageOptions}
            onChat={this._handleNavigateToChat}
          />
        ) : null}
      </div>
    );
  };

  _renderOptions = () => {
    const { navigation, viewer } = this.props;

    return (
      <div className={STYLES_SIDEBAR}>
        <SidebarOptions
          viewer={viewer}
          onDismiss={this._handleHideOptions}
          onSignOut={this._handleSignOut}
        />
      </div>
    );
  };

  _renderMessageOptions = () => {
    const { navigation, viewer } = this.props;

    return (
      <div className={STYLES_SIDEBAR}>
        <SidebarOptionsMessages viewer={viewer} onDismiss={this._handleHideOptions} />
      </div>
    );
  };

  _renderChannelOptions = () => {
    const { navigation, viewer } = this.props;

    return (
      <div className={STYLES_SIDEBAR}>
        <SidebarOptionsChannels viewer={viewer} onDismiss={this._handleHideOptions} />
      </div>
    );
  };

  render() {
    const { mode } = this.state;
    const { navigation } = this.props;

    if (navigation.isFullScreen) {
      return null;
    }

    let sidebarElement = this._renderRootSidebar();
    if (mode === 'OPTIONS') {
      sidebarElement = this._renderOptions();
    }

    if (mode === 'OPTIONS_CHANNELS') {
      sidebarElement = this._renderChannelOptions();
    }

    if (mode === 'OPTIONS_MESSAGES') {
      sidebarElement = this._renderMessageOptions();
    }

    if (navigation.contentMode === 'game') {
      return null;
    }

    return <div className={STYLES_CONTAINER}>{sidebarElement}</div>;
  }
}

export default class SidebarWithContext extends React.Component {
  render() {
    return (
      <CurrentUserContext.Consumer>
        {(currentUser) => {
          return (
            <SocialContext.Consumer>
              {(social) => {
                return (
                  <ChatSessionContext.Consumer>
                    {(chat) => {
                      return (
                        <NavigationContext.Consumer>
                          {(navigation) => {
                            return (
                              <NavigatorContext.Consumer>
                                {(navigator) => (
                                  <Sidebar
                                    viewer={currentUser.user}
                                    currentUser={currentUser}
                                    navigator={navigator}
                                    navigation={navigation}
                                    social={social}
                                    chat={chat}
                                  />
                                )}
                              </NavigatorContext.Consumer>
                            );
                          }}
                        </NavigationContext.Consumer>
                      );
                    }}
                  </ChatSessionContext.Consumer>
                );
              }}
            </SocialContext.Consumer>
          );
        }}
      </CurrentUserContext.Consumer>
    );
  }
}
