import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import { css } from 'react-emotion';

import UIAvatar from '~/components/reusable/UIAvatar';
import UIHeading from '~/components/reusable/UIHeading';
import UIPlayIcon from '~/components/reusable/UIPlayIcon';

// TODO: audit styles

const STYLES_CONTAINER = css`
  background: ${Constants.colors.white};
  width: 100%;
`;

const STYLES_EMPTY = css`
  height: 124px;
`;

const STYLES_COVER = css`
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
  max-width: 25%;
  padding-right: 16px;
`;

const STYLES_TOP = css`
  display: flex;
  margin-bottom: 24px;
`;

const STYLES_TITLE = css`
  font-size: 48px;
  line-height: 52px;
  font-weight: 400;
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

const STYLES_PLAY_CTA = css`
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;

  span {
    font-family: ${Constants.font.system};
    color: #8d8d8d;
    text-transform: uppercase;
    font-size: 14px;
    font-weight: 600;
  }
`;

const STYLES_META_ITEM = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${Constants.colors.black};
  font-family: ${Constants.font.system};
  font-weight: 600;
  font-size: 12px;
  margin-right: 24px;
`;

const STYLES_META_LINK_ITEM = css`
  cursor: pointer;

  span {
    margin-left: 0.3em;
  }

  :hover {
    span {
      text-decoration: underline;
    }
  }
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

export default class GameMetaHeader extends React.Component {
  state = {
    isHoveringOnPlay: false,
  };

  _renderCreator = (user) => {
    const avatarSrc = user && user.photo ? user.photo.url : null;
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

  render() {
    const { game } = this.props;
    if (!game) return <div className={`${STYLES_CONTAINER} ${STYLES_EMPTY}`} />;

    let aboutElement;
    if (!Strings.isEmpty(game.description)) {
      aboutElement = <div className={STYLES_ABOUT}>{game.description}</div>;
    }
    let creatorElement;
    if (game.owner && game.owner.userId) {
      creatorElement = this._renderCreator(game.owner);
    }

    const coverImage = game.coverImage ? game.coverImage.url : null;
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_BODY}>
          <div className={STYLES_BODY_LEFT}>
            <div className={STYLES_TOP}>
              <div
                className={STYLES_COVER}
                style={{ backgroundImage: coverImage ? `url('${coverImage}')` : null }}
              />
              <div className={STYLES_GAME_IDENTITY}>
                <UIHeading style={{ marginBottom: 8 }}>{game.title}</UIHeading>
                <div
                  className={STYLES_PLAY_CTA}
                  onClick={() => this.props.onSelectGame(game)}
                  onMouseEnter={() => this.setState({ isHoveringOnPlay: true })}
                  onMouseLeave={() => this.setState({ isHoveringOnPlay: false })}>
                  <UIPlayIcon
                    size={14}
                    hovering={this.state.isHoveringOnPlay}
                    style={{ width: 16, height: 24 }}
                  />
                  <span>Play</span>
                </div>
              </div>
            </div>
          </div>
          <div className={STYLES_BODY_RIGHT}>
            {aboutElement}
            {creatorElement}
          </div>
        </div>
      </div>
    );
  }
}
