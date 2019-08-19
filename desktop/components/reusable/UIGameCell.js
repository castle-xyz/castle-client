import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Urls from '~/common/urls';
import * as Strings from '~/common/strings';
import * as NativeUtil from '~/native/nativeutil';

import { css } from 'react-emotion';

import UIGameCellActionsBar from '~/components/reusable/UIGameCellActionsBar';
import UIPlayIcon from '~/components/reusable/UIPlayIcon';

// NOTE(jim): This needs to be revised so that we're not animating padding
// but we're doing a transform for performance to make use of the compositor.
const STYLES_CONTAINER = css`
  display: inline-block;
  position: relative;
  cursor: pointer;
  background: transparent;
  border-radius: ${Constants.card.radius};

  figure {
    border-radius: ${Constants.card.radius};
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }
`;

const STYLES_TOP_SECTION = css`
  width: ${Constants.card.width};
  height: ${Constants.card.imageHeight};
`;

const STYLES_GAME_SCREENSHOT = css`
  width: ${Constants.card.imageWidth};
  height: ${Constants.card.imageHeight};
  cursor: pointer;
  background-size: cover;
  background-position: 50% 50%;
  background-color: ${Constants.colors.black};
`;

const STYLES_DESCRIPTION_SECTION = css`
  padding: 12px 16px 8px 16px;
  font-family: ${Constants.font.system};
`;

const STYLES_GAME_DESCRIPTION_HEADER = css`
  display: flex;
  flex-direction: row;
  font-size: 16px;
  font-weight: 600;
`;

const STYLES_GAME_DESCRIPTION = css`
  margin-top: 16px;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 400;
`;

const STYLES_DETAIL_SECTION = css`
  display: flex;
  flex-direction: row;
  padding-top: 16px;
  height: 68px;
`;

const STYLES_TITLE_AND_PLAY = css`
  display: flex;
  flex-direction: row;
  line-height: 0.8;
`;

const STYLES_GAME_TITLE_AND_AUTHOR = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 25%;
`;

const STYLES_GAME_TITLE = css`
  display: inline-flex;
  font-family: ${Constants.font.system};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  :hover {
    color: #55555f;
  }
`;

const STYLES_AVATAR = css`
  background-size: cover;
  background-position: 50% 50%;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
  margin-right: 8px;
`;

const STYLES_BYLINE = css`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
`;

const STYLES_SECONDARY_TEXT = css`
  font-family: ${Constants.font.system};
  font-size: 13px;
  color: #8d8d8d;
  font-weight: 500;
  margin-top: 2px;
`;

const STYLES_AUTHOR_AND_PLAY_COUNT = css`
  margin-top: 4px;
  display: flex;
  flex-direction: row;
`;

const STYLES_GAME_AUTHOR = css`
  display: inline-flex;
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`;

const STYLES_PLAY_COUNT = css`
  margin-left: 5px;
`;

export default class UIGameCell extends React.Component {
  static defaultProps = {
    game: null,
    onGameSelect: () => {},
    onUserSelect: () => {},
    onShowGameInfo: () => {},
    onGameUpdate: null,
    theme: {},
  };

  state = {
    isHoveringOnPlay: false,
    isHoveringOnActions: false,
    isHoveringOnAuthor: false,
    isShowingGameInfo: false,
    gameUrlWasCopiedToClipboard: false,
  };

  _handleToggleHoverOnPlay = (shouldSetHovering) => {
    this.setState({ isHoveringOnPlay: shouldSetHovering });
  };

  _handleToggleShowGameInfo = (shouldShow) => {
    this.setState({ isShowingGameInfo: shouldShow });
  };

  _handleHoverOnActionsBar = (action, isHovering) => {
    this.setState({ isHoveringOnActions: isHovering });
  };

  _handleToggleHoverOnAuthor = (shouldSetHovering) => {
    this.setState({ isHoveringOnAuthor: shouldSetHovering });
  };

  _handleToggleVisibility = () => {
    this.setState({ isPopoverVisible: !this.state.isPopoverVisible });
  };

  _handleDismiss = () => {
    this.setState({ isPopoverVisible: false });
  };

  _handleViewSource = (gameEntryPoint) => {
    NativeUtil.openExternalURL(Urls.githubUserContentToRepoUrl(gameEntryPoint));
  };

  _handleCopyUrlToClipboard = () => {
    let textField = document.createElement('textarea');
    textField.innerText = this.props.game.url;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
    this.setState({ gameUrlWasCopiedToClipboard: true });
  };

  _handleGameSelect = () => {
    if (this.state.isHoveringOnActions || this.state.isHoveringOnAuthor) {
      return false;
    }
    this.props.onGameSelect(this.props.game);
  };

  _handleMouseLeave = () => {
    this._handleToggleHoverOnPlay(false);
    this.setState({ gameUrlWasCopiedToClipboard: false });
    this._handleToggleShowGameInfo(false);
  };

  render() {
    let { game } = this.props;
    let title = game.title ? Strings.elide(game.title, 21) : 'Untitled';
    let onGameUpdate = this.props.onGameUpdate ? () => this.props.onGameUpdate(game) : null;

    const isMultiplayer = game.metadata.multiplayer && game.metadata.multiplayer.enabled;
    const numPlayersText = isMultiplayer ? 'Multiplayer' : ' ';
    const draftText = game.draft
      ? isMultiplayer
        ? '\u2022 Work in Progress'
        : 'Work in Progress'
      : ' ';

    let detailLine = (
      <span className={STYLES_SECONDARY_TEXT}>
        {numPlayersText}
        {draftText}
      </span>
    );

    const hoveringOnDetailIcon = this.state.isHoveringOnActions || this.state.isHoveringOnAuthor;
    let descriptionText = game.description
      ? Strings.elide(game.description, 104)
      : 'No description yet :)';
    let username, playCount;

    let isPrivate = Urls.isPrivateUrl(game.url);
    let isLocalFile = isPrivate || !game.owner || !game.owner.username;
    if (isLocalFile) {
      descriptionText = game.url;
      username = 'Local Project'; // TODO(Jason): show date last edited?
    } else {
      username = game.owner.username;
      playCount = (
        <span className={STYLES_PLAY_COUNT}>
          {'\u2022 '}
          {game.playCount} plays
        </span>
      );
    }

    let shouldShowGameInfo = isLocalFile || this.state.isShowingGameInfo;

    return (
      <div
        className={STYLES_CONTAINER}
        onMouseEnter={() => this._handleToggleHoverOnPlay(true)}
        onMouseLeave={this._handleMouseLeave}
        onClick={this._handleGameSelect}>
        <div className={STYLES_TOP_SECTION} style={{ width: this.props.theme.embedWidth }}>
          {shouldShowGameInfo ? (
            <div className={STYLES_DESCRIPTION_SECTION}>
              <div className={STYLES_BYLINE} onClick={() => this.props.onUserSelect(game.owner)}>
                {!isLocalFile ? (
                  <div
                    className={STYLES_AVATAR}
                    style={{
                      backgroundImage:
                        game.owner && game.owner.photo && game.owner.photo.url
                          ? `url(${game.owner.photo.url})`
                          : null,
                    }}
                  />
                ) : null}
                <div className={STYLES_GAME_DESCRIPTION_HEADER}>{username}</div>
              </div>
              <div
                className={STYLES_GAME_DESCRIPTION}
                style={{ wordWrap: isLocalFile ? 'break-word' : 'normal' }}>
                {descriptionText}
              </div>
            </div>
          ) : (
            <figure
              className={STYLES_GAME_SCREENSHOT}
              style={{
                backgroundImage: this.props.src ? `url(${this.props.src})` : null,
                filter: this.state.isHoveringOnPlay ? 'brightness(105%)' : null,
              }}
            />
          )}
        </div>

        <section
          className={STYLES_DETAIL_SECTION}
          style={{
            background: !this.state.isHoveringOnPlay ? null : this.props.theme.embedBackground,
          }}>
          {!this.state.isShowingGameInfo ? (
            <div className={STYLES_GAME_TITLE_AND_AUTHOR}>
              <div className={STYLES_TITLE_AND_PLAY}>
                <span className={STYLES_GAME_TITLE}>{title}</span>
              </div>
              <div className={STYLES_SECONDARY_TEXT}>
                <div className={STYLES_AUTHOR_AND_PLAY_COUNT}>
                  <span
                    className={STYLES_GAME_AUTHOR}
                    onClick={() => this.props.onUserSelect(game.owner)}
                    onMouseEnter={() => this._handleToggleHoverOnAuthor(true)}
                    onMouseLeave={() => this._handleToggleHoverOnAuthor(false)}>
                    {username}
                  </span>
                  {playCount}
                </div>
              </div>
              {detailLine}
            </div>
          ) : null}
          <UIPlayIcon
            hovering={this.state.isHoveringOnPlay && !hoveringOnDetailIcon}
            visible={this.state.isHoveringOnPlay}
          />
        </section>

        {this.state.isHoveringOnPlay ? (
          <UIGameCellActionsBar
            isLocalFile={isLocalFile}
            isShowingInfo={shouldShowGameInfo}
            didCopyToClipboard={this.state.gameUrlWasCopiedToClipboard}
            onGameUpdate={onGameUpdate}
            onShowGameInfo={this._handleToggleShowGameInfo}
            onCopyUrl={this._handleCopyUrlToClipboard}
            onHover={this._handleHoverOnActionsBar}
          />
        ) : null}
      </div>
    );
  }
}
