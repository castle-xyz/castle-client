import ReactDOM from 'react-dom';

import * as React from 'react';
import * as Constants from '~/common/constants';

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
            name: 'Play games',
            svg: 'featured',
            onClick: this.props.onNavigateToFeaturedGames,
            active: this.props.contentMode === 'featured',
          }}
        />
        <SidebarNavigationItem
          data={{
            name: 'Create game',
            svg: 'make',
            onClick: this.props.onNavigateToMakeGame,
            active: this.props.contentMode === 'create',
          }}
        />
        <SidebarNavigationItem
          data={{
            name: 'Posts',
            svg: 'posts',
            onClick: this.props.onNavigateToAllPosts,
            active: this.props.contentMode === 'posts',
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
