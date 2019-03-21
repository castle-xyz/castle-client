import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Utilities from '~/common/utilities';
import * as Urls from '~/common/urls';

import { css } from 'react-emotion';

import UIAvatar from '~/components/reusable/UIAvatar';
import UICharacterCard from '~/components/reusable/UICharacterCard';

const STYLES_CONTAINER = css`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
`;

//  box-shadow: inset 0 0 0 1px red;
const STYLES_GAME = css`
  display: inline-block;
  padding: 24px 24px 24px 24px;
  position: relative;
`;

const STYLES_GAME_ITEM = css`
  background: ${Constants.colors.white};
  cursor: pointer;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const STYLES_GAME_SCREENSHOT = css`
  color: ${Constants.colors.black};
  width: 188px;
  height: 106px;
  flex-shrink: 0;
  transition: 200ms ease all;
  cursor: pointer;
  background-size: cover;
  background-position: 50% 50%;
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  color: ${Constants.colors.white};
  background-color: rgba(0, 0, 0, 0.1);
`;

const STYLES_TITLE = css`
  text-align: right;
  margin-top: 8px;
  font-family: ${Constants.font.game};
  font-size: 18px;
  width: 188px;
  height: 56px;
`;

const STYLES_AVATAR = css`
  background-size: cover;
  background-position: 50% 50%;
  height: 24px;
  width: 24px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.07);
`;

const STYLES_AVATAR_CREATOR = css`
  font-family: ${Constants.font.system};
  font-weight: 700;
  color: ${Constants.colors.white};
`;

const STYLES_BYLINE = css`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

class UIGameCell extends React.Component {
  render() {
    let { game } = this.props;
    const title = game.title ? game.title : 'Untitled';

    const backgroundColor =
      game.metadata && game.metadata.primaryColor ? `#${game.metadata.primaryColor}` : '#000000';
    const textColor = Utilities.adjustTextColor(backgroundColor);

    if (this.props.renderCartridgeOnly) {
      return (
        <div className={STYLES_GAME}>
          <div className={STYLES_GAME_ITEM} style={{ color: textColor, backgroundColor }}>
            <div
              className={STYLES_GAME_SCREENSHOT}
              onClick={() => this.props.onGameSelect(game)}
              style={{ backgroundImage: this.props.src ? `url(${this.props.src})` : null }}
            />
            <div className={STYLES_TITLE} onClick={() => this.props.onGameSelect(game)}>
              {title}
            </div>
          </div>
        </div>
      );
    }

    let description;
    if (Urls.isPrivateUrl(game.url) || !game.owner || !game.owner.name) {
      // NOTE(jim): Local project doesn't provide descriptions.
      description = <div className={STYLES_BYLINE}>{game.url}</div>;
    }

    return (
      <div className={STYLES_GAME} style={{ paddingLeft: game.owner ? `48px` : null }}>
        <div className={STYLES_GAME_ITEM} style={{ color: textColor, backgroundColor }}>
          <div
            className={STYLES_GAME_SCREENSHOT}
            onClick={() => this.props.onGameSelect(game)}
            style={{ backgroundImage: this.props.src ? `url(${this.props.src})` : null }}
          />
          <div
            className={STYLES_TITLE}
            style={{ paddingLeft: game.owner ? `48px` : null }}
            onClick={() => this.props.onGameSelect(game)}>
            {title}
          </div>
        </div>
        {description}
        {game.owner ? (
          <UICharacterCard
            style={{ position: 'absolute', bottom: '0px', left: '24px', transform: `scale(0.8)` }}
            user={game.owner}
            onAvatarClick={() => this.props.onUserSelect(game.owner)}
          />
        ) : null}
      </div>
    );
  }
}

export default class UIGameGrid extends React.Component {
  render() {
    const { gameItems } = this.props;
    return (
      <div className={STYLES_CONTAINER}>
        {gameItems.map((m) => {
          const key = m.key ? m.key : m.gameId ? m.gameId : m.url;
          return (
            <UIGameCell
              key={key}
              renderCartridgeOnly={this.props.renderCartridgeOnly}
              onGameSelect={this.props.onGameSelect}
              onGameUpdate={this.props.onGameUpdate}
              onUserSelect={this.props.onUserSelect}
              src={m.coverImage && m.coverImage.imgixUrl}
              game={m}
            />
          );
        })}
      </div>
    );
  }
}
