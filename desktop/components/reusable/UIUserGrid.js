import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';
import UIAvatar from '~/components/reusable/UIAvatar';
import UICharacterCard from '~/components/reusable/UICharacterCard';

const STYLES_CONTAINER = css`
  display: flex;
  flex-wrap: wrap;
  max-width: 960px;
  padding: 24px;
`;

class UIUserCell extends React.Component {
  render() {
    const { user } = this.props;
    const avatarSrc = user && user.photo ? user.photo.imgixUrl : null;
    const name = user.name ? user.name : user.username;
    return (
      <div className={STYLES_USER_CELL} onClick={() => this.props.onUserSelect(this.props.user)}>
        <UIAvatar src={avatarSrc} />
        <div className={STYLES_USER_NAME}>{name}</div>
      </div>
    );
  }
}

export default class UIUserGrid extends React.Component {
  render() {
    const { users } = this.props;
    return (
      <div className={STYLES_CONTAINER}>
        {users.map((u) => {
          return (
            <UICharacterCard
              key={u.userId}
              user={u}
              style={{ margin: `0 16px 16px 0` }}
              onAvatarClick={() => this.props.onUserSelect(u)}
            />
          );
        })}
      </div>
    );
  }
}
