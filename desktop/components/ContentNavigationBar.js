import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Urls from '~/common/urls';

import { css } from 'react-emotion';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';

import SearchInput from '~/components/SearchInput';
import UINavigationLink from '~/components/reusable/UINavigationLink';

const ENABLE_NOTIF_SCREEN = false; // feature flag notification item

const STYLES_CONTAINER = css`
  background: #8f8b8b;
  flex-shrink: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_SEARCH_SECTION = css`
  width: 100%;
  min-width: 25%;
`;

const STYLES_NAV_ITEMS = css`
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
`;

class ContentNavigationBar extends React.Component {
  _renderTopNavigationItems = () => {
    let { game, navigator } = this.props;
    let maybeNotifItem;

    if (ENABLE_NOTIF_SCREEN) {
      maybeNotifItem = (
        <UINavigationLink onClick={navigator.navigateToNotifications} style={{ marginRight: 24 }}>
          Notifications
        </UINavigationLink>
      );
    }
    return <div className={STYLES_NAV_ITEMS}>{maybeNotifItem}</div>;
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_SEARCH_SECTION}>
          <SearchInput
            query={this.props.searchQuery}
            onSearchReset={this.props.onSearchReset}
            onChange={this.props.onSearchChange}
            onSubmit={this.props.onSearchSubmit}
          />
        </div>
        {this._renderTopNavigationItems()}
      </div>
    );
  }
}

export default class ContentNavigationBarWithContext extends React.Component {
  render() {
    return (
      <NavigationContext.Consumer>
        {(navigation) => (
          <NavigatorContext.Consumer>
            {(navigator) => (
              <ContentNavigationBar game={navigation.game} navigator={navigator} {...this.props} />
            )}
          </NavigatorContext.Consumer>
        )}
      </NavigationContext.Consumer>
    );
  }
}
