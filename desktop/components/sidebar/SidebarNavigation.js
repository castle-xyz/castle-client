import * as React from 'react';

import { css } from 'react-emotion';

import SidebarNavigationItem from '~/components/sidebar/SidebarNavigationItem';

const STYLES_CONTAINER = css`
  margin-bottom: 24px;
`;

export default class SidebarNavigation extends React.Component {
  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <SidebarNavigationItem
          data={{
            name: 'Play',
            svg: 'home',
            onClick: this.props.onNavigateToGames,
            active: this.props.contentMode === 'home',
          }}
        />
        <SidebarNavigationItem
          data={{
            name: 'Create',
            svg: 'make',
            onClick: this.props.onNavigateToMakeGame,
            active: this.props.contentMode === 'create',
          }}
        />
        {this.props.viewer ? (
          <SidebarNavigationItem
            data={{
              name: 'History',
              svg: 'history',
              onClick: this.props.onNavigateToHistory,
              active: this.props.contentMode === 'history',
            }}
          />
        ) : null}
      </div>
    );
  }
}
