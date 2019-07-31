import * as React from 'react';

import { css } from 'react-emotion';

import SidebarProjects from '~/components/sidebar/SidebarProjects';
import SidebarNavigationItem from '~/components/sidebar/SidebarNavigationItem';

const STYLES_CONTAINER = css`
  margin-bottom: 8px;
`;

export default class SidebarSectionCreate extends React.Component {
  render() {
    const { userStatusHistory, contentMode, onNavigateToCreate, onNavigateToGameUrl } = this.props;
    const isChatVisible = contentMode === 'chat';

    return (
      <div className={STYLES_CONTAINER}>
        <SidebarNavigationItem
          name="Create"
          svg="make"
          onClick={onNavigateToCreate}
          active={contentMode === 'create'}
        />
        <SidebarProjects
          title="Recently Created"
          userStatusHistory={userStatusHistory}
          onSelectGameUrl={onNavigateToGameUrl}
        />
      </div>
    );
  }
}
