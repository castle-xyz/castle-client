import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Urls from '~/common/urls';

import { css } from 'react-emotion';

import SidebarActivityItem from '~/components/sidebar/SidebarActivityItem';
import UserStatus from '~/common/userstatus';

const STYLES_CONTAINER = css`
  margin-bottom: 32px;
`;

export default class SidebarProjects extends React.Component {
  static defaultProps = {
    items: [],
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

  render() {
    const { userStatusHistory } = this.props;

    let filteredItems;
    if (userStatusHistory) {
      filteredItems = UserStatus.uniqueLocalUserStatuses(userStatusHistory).map((status) => {
        return {
          name: status.game.title,
          url: status.game.url,
        };
      });
    }
    if (!filteredItems.length) {
      return null;
    }

    return (
      <div className={STYLES_CONTAINER}>
        {filteredItems.map((p, ii) => {
          return (
            <SidebarActivityItem
              key={`project-${ii}-${p.url}`}
              name={this._getProjectDisplayName(p)}
              type="create"
              isUnread={false}
              notificationCount={0}
              isSelected={false}
              onClick={() => this.props.onSelectGameUrl(p.url)}
            />
          );
        })}
      </div>
    );
  }
}
