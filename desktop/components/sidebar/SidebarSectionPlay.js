import * as React from 'react';

import { css } from 'react-emotion';

import SidebarChannels from '~/components/sidebar/SidebarChannels';
import SidebarNavigationItem from '~/components/sidebar/SidebarNavigationItem';

const STYLES_CONTAINER = css`
  margin-bottom: 8px;
`;

export default class SidebarSectionPlay extends React.Component {
  _filterGameChannels = (channel) => channel.isSubscribed && channel.type === 'game';

  render() {
    const {
      chat,
      contentMode,
      chatChannelId,
      userStatusHistory,
      onNavigateToGames,
      onNavigateToChat,
    } = this.props;
    const isChatVisible = contentMode === 'chat';

    return (
      <div className={STYLES_CONTAINER}>
        <SidebarNavigationItem
          name="Play"
          svg="home"
          onClick={onNavigateToGames}
          active={contentMode === 'home'}
        />
        <SidebarChannels
          selectedChannelId={chatChannelId}
          userStatusHistory={userStatusHistory}
          isChatVisible={isChatVisible}
          channels={chat.channels}
          filterChannel={this._filterGameChannels}
          onSelectChannel={onNavigateToChat}
        />
      </div>
    );
  }
}
