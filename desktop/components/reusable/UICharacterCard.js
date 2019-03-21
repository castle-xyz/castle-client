import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_CARD = css`
  flex-shrink: 0;
  width: 90px;
`;

const STYLES_CARD_CONTENT = css`
  background: ${Constants.colors.black};
  border: 1px solid ${Constants.colors.black};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.175);
  border-radius: 2px;
`;

const STYLES_CARD_IMAGE = css`
  height: 88px;
  width: 88px;
  background-size: cover;
  background-position: 50% 50%;
  cursor: pointer;
`;

const STYLES_NAME_STRIP = css`
  background: ${Constants.colors.black};
  color: ${Constants.colors.white};
  text-transform: uppercase;
  text-overflow: ellipsis;
  max-width: 88px;
  overflow: hidden;
  font-size: 11px;
  line-height: 11px;
`;

const STYLES_STATS = css`
  font-family: ${Constants.font.monobold};
  color: ${Constants.colors.white};
  display: block;
  font-size: 11px;
`;

const STYLES_STATS_ROW = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  padding: 0 2px 0 9px;
`;

const STYLES_STATS_ROW_LEFT = css`
  flex-shrink: 0;
`;

const STYLES_STATS_ROW_RIGHT = css`
  min-width: 25%;
  width: 100%;
  padding-left: 8px;
`;

export const getExp = ({ playCount, gameCount }) => {
  return playCount * 5 + gameCount * 1500;
};

export const getLevel = (exp) => {
  if (exp < 1000) {
    return 1;
  }

  if (exp < 2000) {
    return 2;
  }

  if (exp < 4000) {
    return 3;
  }

  if (exp < 8000) {
    return 5;
  }

  if (exp < 16000) {
    return 6;
  }

  if (exp < 32000) {
    return 7;
  }

  if (exp < 64000) {
    return 'MAX';
  }
};

export default class UICharacterCard extends React.Component {
  render() {
    const { user } = this.props;
    const { gamesCount, gamesSumPlayCount } = user;

    const exp = getExp({ playCount: gamesSumPlayCount, gameCount: gamesCount });
    const level = getLevel(exp);

    return (
      <span className={STYLES_CARD} onClick={this.props.onClick} style={this.props.style}>
        <div className={STYLES_CARD_CONTENT}>
          <div
            className={STYLES_CARD_IMAGE}
            onClick={this.props.onAvatarClick}
            style={{
              backgroundImage: user.photo && user.photo.url ? `url(${user.photo.url})` : null,
            }}
          />
          <div className={STYLES_NAME_STRIP}>@{user.username}</div>
          <div className={STYLES_STATS}>
            <div className={STYLES_STATS_ROW}>
              <span className={STYLES_STATS_ROW_LEFT} style={{ color: Constants.colors.brand2 }}>
                LVL
              </span>
              <span className={STYLES_STATS_ROW_RIGHT}>{level}</span>
            </div>
            <div className={STYLES_STATS_ROW}>
              <span className={STYLES_STATS_ROW_LEFT} style={{ color: Constants.colors.darkcyan }}>
                EXP
              </span>
              <span className={STYLES_STATS_ROW_RIGHT}>{exp}</span>
            </div>
          </div>
        </div>
      </span>
    );
  }
}
