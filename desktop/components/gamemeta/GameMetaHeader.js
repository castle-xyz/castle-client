import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as Utilities from '~/common/utilities';

import { css } from 'react-emotion';

import UIAvatar from '~/components/reusable/UIAvatar';
import UIHeading from '~/components/reusable/UIHeading';
import UIPlayIcon from '~/components/reusable/UIPlayIcon';

const STYLES_CONTAINER = css`
  background: ${Constants.colors.white};
  width: 100%;
`;

const STYLES_EMPTY = css`
  height: 124px;
`;

const STYLES_COVER = css`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 90px;
  height: 90px;
  border-radius: 4px;
  background-size: cover;
  background-position: 50% 50%;
`;

const STYLES_BODY = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 16px 0 24px;
`;

const STYLES_BODY_LEFT = css`
  color: ${Constants.colors.text};
  min-width: 25%;
`;

const STYLES_BODY_RIGHT = css`
  max-width: 35%;
  padding-right: 16px;
`;

const STYLES_CTA_CARD = css`
  display: flex;
  cursor: pointer;
  margin: 0 8px 8px 0;
`;

const STYLES_META = css`
  font-family: ${Constants.font.system};
  margin: 4px 0 4px 0;
  font-size: 12px;
`;

const STYLES_ABOUT = css`
  line-height: 1.5;
  font-weight: 200;
  font-size: 16px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 8px;
`;

const STYLES_META_ITEM = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${Constants.REFACTOR_COLORS.subdued};
  font-family: ${Constants.font.system};
  font-weight: 600;
  font-size: 12px;
  margin-right: 24px;
`;

const STYLES_STATUS = css`
  margin-right: 8px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const STYLES_GAME_IDENTITY = css`
  margin-bottom: 16px;
  padding-left: 24px;
`;

const STYLES_CREATOR = css`
  display: flex;
  align-items: center;
  font-family: ${Constants.font.system};
  font-size: 13px;
  font-weight: 500;
  color: #8d8d8d;
`;

const STYLES_CREATOR_LINK = css`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${Constants.colors.text};
  margin: 0 8px;

  :hover {
    text-decoration: underline;
  }
`;

const STYLES_META_ROW = css`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
`;

export default class GameMetaHeader extends React.Component {
  state = {
    isHoveringOnPlay: false,
  };

  _renderCreator = (user) => {
    if (!user || !user.userId) return null;
    const avatarSrc = user.photo ? user.photo.url : null;
    return (
      <div className={STYLES_CREATOR}>
        Created by{' '}
        <span className={STYLES_CREATOR_LINK} onClick={() => this.props.onSelectUser(user)}>
          <UIAvatar
            src={avatarSrc}
            showIndicator={false}
            style={{ width: 20, height: 20, marginRight: 6 }}
          />
          {user.username}
        </span>
      </div>
    );
  };

  _renderStats = (game) => {
    let items = [
      `${game.playCount} plays`,
      Utilities.isMultiplayer(game) ? 'Multiplayer' : 'Single Player',
    ];

    if (game.draft) {
      items.push('Work in Progress');
    }

    if (items.length) {
      return (
        <div className={STYLES_META_ROW}>
          {items.map((item, ii) => (
            <div key={`meta-${ii}`} className={STYLES_META_ITEM}>
              {item}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  render() {
    const { game } = this.props;
    if (!game) return <div className={`${STYLES_CONTAINER} ${STYLES_EMPTY}`} />;

    const coverImage = game.coverImage ? game.coverImage.url : null;
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_BODY}>
          <div className={STYLES_BODY_LEFT}>
            <div
              className={STYLES_CTA_CARD}
              onClick={() => this.props.onSelectGame(game)}
              onMouseEnter={() => this.setState({ isHoveringOnPlay: true })}
              onMouseLeave={() => this.setState({ isHoveringOnPlay: false })}>
              <div
                className={STYLES_COVER}
                style={{
                  backgroundImage: coverImage ? `url('${coverImage}')` : null,
                  filter: this.state.isHoveringOnPlay ? 'brightness(95%)' : null,
                }}>
                <UIPlayIcon
                  size={16}
                  hovering={this.state.isHoveringOnPlay}
                  visible={this.state.isHoveringOnPlay}
                />
              </div>
              <div className={STYLES_GAME_IDENTITY}>
                <UIHeading style={{ marginBottom: 8 }}>{game.title}</UIHeading>
                {this._renderStats(game)}
              </div>
            </div>
          </div>
          <div className={STYLES_BODY_RIGHT}>
            {!Strings.isEmpty(game.description) ? (
              <div className={STYLES_ABOUT}>{game.description}</div>
            ) : null}
            {this._renderCreator(game.owner)}
          </div>
        </div>
      </div>
    );
  }
}
