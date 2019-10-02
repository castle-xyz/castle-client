import * as React from 'react';
import * as Constants from '~/common/constants';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';

import { css } from 'react-emotion';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import { NavigationContext, NavigatorContext } from '~/contexts/NavigationContext';

import ContentNavigationMenu from '~/components/ContentNavigationMenu';
import SearchInput from '~/components/SearchInput';
import UIBackForwardControl from '~/components/reusable/UIBackForwardControl';
import UINavigationLink from '~/components/reusable/UINavigationLink';
import UserStatus from '~/common/userstatus';

const STYLES_CONTAINER = css`
  background: #f3f3f3;
  flex-shrink: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
`;

const STYLES_LOGO = css`
  width: 24px;
  height: 24px;
  background: url('static/castle512x512.png');
  border-radius: 4px;
  background-size: cover;
  background-position: 50% 50%;
`;

const STYLES_RIGHT = css`
  width: 25%;
  min-width: 332px;
  display: flex;
`;

const STYLES_SEARCH = css`
  width: 100%;
`;

const STYLES_NAV_ITEM = css`
  font-size: 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 16px;
  padding: 8px 0;
  position: relative;
`;

const STYLES_NAV_LABEL = css`
  cursor: pointer;
`;

const STYLES_NAV_ITEMS = css`
  display: flex;
  justify-content: flex-start;
  flex-shrink: 0;
  max-width: 50%;
  margin-left: 8px;
`;

class ContentNavigationBar extends React.Component {
  state = {
    isHoveringOnPlay: false,
    isHoveringOnCreate: false,
  };

  _truncatePath = (path, chars) => {
    if (path && path.length <= chars) {
      return path;
    } else {
      return `...${path.slice(-(chars - 3))}`;
    }
  };

  _getProjectDisplayName = (project) => {
    let name;
    if (project.name) {
      name = project.name;
    } else if (project.url) {
      name = this._truncatePath(project.url, 23);
    } else {
      name = 'Untitled';
    }
    return name;
  };

  _getPlayItems = () => {
    const { currentUser, navigator } = this.props;

    let items = [
      { name: 'Home', onClick: navigator.navigateToHome },
      { name: 'All Games', onClick: () => navigator.navigateToContentMode('allGames') },
    ];

    const { userStatusHistory } = currentUser;
    if (userStatusHistory) {
      if (items.length > 0) {
        items.push({ isSeparator: true });
      }
      items = items.concat(
        UserStatus.uniqueRegisteredUserStatuses(userStatusHistory).map((status) => {
          return {
            name: this._getProjectDisplayName({ name: status.game.title, url: status.game.url }),
            onClick: () => navigator.navigateToGameMeta(status.game),
          };
        })
      );
    }
    return items;
  };

  _getCreateItems = () => {
    const { currentUser, navigator } = this.props;
    const { userStatusHistory } = currentUser;
    let items = [];
    if (userStatusHistory) {
      items = items.concat(
        UserStatus.uniqueLocalUserStatuses(userStatusHistory).map((status) => {
          return {
            name: this._getProjectDisplayName({ name: status.game.title, url: status.game.url }),
            onClick: () => navigator.navigateToGameUrl(status.game.url),
          };
        })
      );
    }

    const hasExistingProjects = items.length > 0;

    if (hasExistingProjects) {
      items.push({ isSeparator: true });
    }

    items.push({
      name: 'Create a New Game',
      onClick: this.props.navigator.navigateToCreate,
    });

    items.push({
      name: hasExistingProjects ? 'Open another project...' : 'Open a project...',
      onClick: this._handleOpenProject,
    });

    return items;
  };

  _handleOpenProject = async () => {
    try {
      const path = await NativeUtil.chooseOpenProjectPathWithDialogAsync();
      if (path) {
        await this.props.navigator.navigateToGameUrl(`file://${path}`, {
          launchSource: 'create-project',
        });
      }
    } catch (_) {}
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_NAV_ITEMS}>
          <div className={STYLES_NAV_ITEM}>
            <div className={STYLES_NAV_LABEL} onClick={this.props.navigator.navigateToHome}>
              <div className={STYLES_LOGO} />
            </div>
          </div>
          <div
            className={STYLES_NAV_ITEM}
            onMouseEnter={() => this.setState({ isHoveringOnPlay: true })}
            onMouseLeave={() => this.setState({ isHoveringOnPlay: false })}>
            <span className={STYLES_NAV_LABEL} onClick={this.props.navigator.navigateToHome}>
              Play
            </span>
            <ContentNavigationMenu
              visible={this.state.isHoveringOnPlay}
              items={this._getPlayItems()}
            />
          </div>
          <div
            className={STYLES_NAV_ITEM}
            onMouseEnter={() => this.setState({ isHoveringOnCreate: true })}
            onMouseLeave={() => this.setState({ isHoveringOnCreate: false })}>
            <span className={STYLES_NAV_LABEL} onClick={this.props.navigator.navigateToCreate}>
              Create
            </span>
            <ContentNavigationMenu
              visible={this.state.isHoveringOnCreate}
              items={this._getCreateItems()}
            />
          </div>
        </div>
        <div className={STYLES_RIGHT}>
          <UIBackForwardControl
            history={this.props.contentHistory}
            onBack={this.props.navigator.contentHistory.back}
            onForward={this.props.navigator.contentHistory.forward}
          />
          <div className={STYLES_SEARCH}>
            <SearchInput
              query={this.props.searchQuery}
              onSearchReset={this.props.onSearchReset}
              onChange={this.props.onSearchChange}
              onSubmit={this.props.onSearchSubmit}
            />
          </div>
        </div>
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
              <CurrentUserContext.Consumer>
                {(currentUser) => (
                  <ContentNavigationBar
                    currentUser={currentUser}
                    navigator={navigator}
                    contentHistory={navigation.contentHistory}
                    {...this.props}
                  />
                )}
              </CurrentUserContext.Consumer>
            )}
          </NavigatorContext.Consumer>
        )}
      </NavigationContext.Consumer>
    );
  }
}
