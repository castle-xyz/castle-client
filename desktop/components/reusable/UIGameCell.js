import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Urls from '~/common/urls';
import * as Utilities from '~/common/utilities';
import * as Strings from '~/common/strings';
import * as NativeUtil from '~/native/nativeutil';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';
import { Tooltip } from 'react-tippy';

const STYLES_CONTAINER = css`
  display: inline-block;
  position: relative;
  margin-left: -4px;
  margin-bottom: 8px;
  padding: 8px 6px 8px 8px;
  cursor: pointer;
  background: ${Constants.colors.background};

  border-radius: ${Constants.card.radius};
  transition: 95ms ease-out transform;
  :hover {
    transition: 10ms ease-in transform;
    box-shadow: ${Constants.card.boxShadow};
    background: ${Constants.card.background};
    z-index: 1;
  }
`;

const STYLES_TOP_SECTION = css`
  width: ${Constants.card.width};
  height: ${Constants.card.imageHeight};
`;

const STYLES_GAME_SCREENSHOT = css`
  width: ${Constants.card.width};
  height: ${Constants.card.imageHeight};
  border-radius: ${Constants.card.radius} ${Constants.card.radius} 0px 0px;
  cursor: pointer;
  background-size: cover;
  background-position: 50% 50%;
  background-color: rgba(0, 0, 0, 0.1);
`;

const STYLES_PLAY_ICON = css`
  width: 8px;
  height: 8px;
  color: ${Constants.card.iconColor};
  margin-left: 8px;
  margin-top: -2px;
`;

const STYLES_PLAY_HOVER = css`
  cursor: pointer;
  @keyframes button-color-change {
    0% {
      color: ${Constants.colors.brand4};
    }
    50% {
      color: ${Constants.colors.brand1};
    }
    100% {
      color: ${Constants.colors.brand2};
    }
  }
  animation: button-color-change infinite 400ms;
  color: white;
`;

const STYLES_OPTIONS_BAR = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  color: #7f7f7f;
  border-radius: 4px;
  border: 1px solid #cdcdcd;
  height: 36px;
  position: absolute;
  right: 8px;
  top: 8px;
  cursor: pointer;
  :hover {
    box-shadow: ${Constants.card.boxShadow};
  }
`;

const STYLES_INFO = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  :hover {
    color: magenta;
  }
`;

const STYLES_DESCRIPTION_SECTION = css`
  font-family: ${Constants.font.system};
  padding: 8px 12px 12px 12px;
`;

const STYLES_GAME_DESCRIPTION_HEADER = css`
  display: flex;
  flex-direction: row;
  font-size: 16px;
  font-weight: 600;
`;

const STYLES_GAME_DESCRIPTION = css`
  font-size: 14px;
  font-weight: 400;
  margin-top: 8px;
`;

const STYLES_LINK_BUTTON = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  :hover {
    color: magenta;
  }
`;

const STYLES_COPY_LINK_CONTENTS = css`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  height: 36px;
`;

const STYLES_DETAIL_SECTION = css`
  display: flex;
  flex-direction: row;
  padding: 8px 12px 4px 1px;
  border-radius: 0px 0px ${Constants.card.radius} ${Constants.card.radius};
  min-height: 48px;
`;

const STYLES_TITLE_AND_PLAY = css`
  display: flex;
  flex-direction: row;
`;

const STYLES_GAME_TITLE_AND_AUTHOR = css`
  display: flex;
  flex-direction: column;
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
  margin-right: 8px;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
`;

const STYLES_BYLINE = css`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
`;

const STYLES_AUTHOR_AND_PLAY_COUNT = css`
  display: flex;
  flex-direction: row;
  margin-top: 2px;
  font-family: ${Constants.font.system};
  font-size: 13px;
  color: #8d8d8d;
  font-weight: 500;
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
    renderCartridgeOnly: false,
    underConstruction: false,
  };

  state = {
    mouseX: 0,
    mouseY: 0,
    isHoveringOnPlay: false,
    isHoveringOnInfo: false,
    isHoveringOnLink: false,
    isHoveringOnAuthor: false,
    isShowingGameInfo: false,
    gameUrlWasCopiedToClipboard: false,
  };

  _handleToggleHoverOnPlay = (shouldSetHovering) => {
    this.setState({ isHoveringOnPlay: shouldSetHovering });
  };

  _handleMouseMove = () => {
    let bounds = this._containerRef.getBoundingClientRect();
    let x = (100 * (event.clientX - bounds.left)) / bounds.width;
    let y = (100 * (event.clientY - bounds.top)) / bounds.height;

    this.setState({ mouseX: x, mouseY: y });
  };

  _handleToggleShowGameInfo = (shouldShow) => {
    this.setState({ isShowingGameInfo: shouldShow });
  };

  _handleToggleHoverOnInfo = (shouldSetHovering) => {
    this.setState({ isHoveringOnInfo: shouldSetHovering });
  };

  _handleToggleHoverOnLink = (shouldSetHovering) => {
    this.setState({ isHoveringOnLink: shouldSetHovering });
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
    if (
      this.state.isHoveringOnInfo ||
      this.state.isHoveringOnLink ||
      this.state.isHoveringOnAuthor
    ) {
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
    let { mouseX, mouseY } = this.state;
    let title = game.title ? game.title : 'Untitled';

    const backgroundColor =
      game.metadata && game.metadata.primaryColor ? `#${game.metadata.primaryColor}` : '#F4F4F5';
    const textColor = Utilities.adjustTextColorWithEmphasis(backgroundColor, this.state.isHovering);

    const finalColor = this.state.isHoveringOnPlay
      ? Utilities.colorLuminance(backgroundColor, 0.8)
      : backgroundColor;

    const hoveringOnDetailIcon =
      this.state.isHoveringOnInfo || this.state.isHoveringOnLink || this.state.isHoveringOnAuthor;
    let descriptionText = game.description
      ? Strings.elide(game.description, 260)
      : 'No description yet :)';
    let username = '';

    let isPrivate = Urls.isPrivateUrl(game.url);
    let isLocalFile = isPrivate || !game.owner || !game.owner.name;
    if (isLocalFile) {
      descriptionText = game.url;
      username = 'File URL'; // TODO(Jason): show date last edited?
    } else {
      username = game.owner.username;
    }

    let shouldShowGameInfo = isLocalFile || this.state.isShowingGameInfo;

    return (
      <div
        className={STYLES_CONTAINER}
        ref={(c) => {
          this._containerRef = c;
        }}
        onMouseEnter={() => this._handleToggleHoverOnPlay(true)}
        onMouseLeave={() => this._handleMouseLeave()}
        onMouseMove={() => this._handleMouseMove()}
        onClick={this._handleGameSelect}
        style={{
          transform: this.state.isHoveringOnPlay ? 'scale(1.006)' : 'scale(1.0)',
          background: this.state.isHoveringOnPlay
            ? `radial-gradient(at ${mouseX}% ${mouseY}%, #FCFCFD, ${Constants.card.background})`
            : 'transparent',
        }}>
        <div className={STYLES_TOP_SECTION}>
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
            <div
              className={STYLES_GAME_SCREENSHOT}
              style={{
                backgroundImage: this.props.src ? `url(${this.props.src})` : null,
                filter: this.state.isHoveringOnPlay ? 'brightness(105%)' : 'none',
              }}></div>
          )}
        </div>

        <div
          className={STYLES_DETAIL_SECTION}
          style={{ borderTop: this.isHoveringOnPlay ? '1px solid #EAEAEB' : 'none' }}>
          {!this.state.isShowingGameInfo ? (
            <div className={STYLES_GAME_TITLE_AND_AUTHOR}>
              <div className={STYLES_TITLE_AND_PLAY}>
                <span className={STYLES_GAME_TITLE}>{title}</span>
                <span
                  className={
                    this.state.isHoveringOnPlay && !hoveringOnDetailIcon
                      ? `${STYLES_PLAY_ICON} ${STYLES_PLAY_HOVER}`
                      : STYLES_PLAY_ICON
                  }>
                  <SVG.Play size="32px" />
                </span>
              </div>
              <div className={STYLES_AUTHOR_AND_PLAY_COUNT}>
                <span
                  className={STYLES_GAME_AUTHOR}
                  onClick={() => this.props.onUserSelect(game.owner)}
                  onMouseEnter={() => this._handleToggleHoverOnAuthor(true)}
                  onMouseLeave={() => this._handleToggleHoverOnAuthor(false)}>
                  {username}
                </span>
                <span className={STYLES_PLAY_COUNT}>
                  {'\u2022 '}
                  {game.playCount} plays
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {this.state.isHoveringOnPlay ? (
          <div className={STYLES_OPTIONS_BAR}>
            {!isLocalFile ? (
              <Tooltip
                title={shouldShowGameInfo ? 'Show preview' : 'Show info'}
                arrow={true}
                duration={170}
                animation="fade"
                hideOnClick={false}>
                <div
                  className={STYLES_INFO}
                  onMouseEnter={() => this._handleToggleHoverOnInfo(true)}
                  onMouseLeave={() => this._handleToggleHoverOnInfo(false)}
                  onClick={() => this._handleToggleShowGameInfo(!shouldShowGameInfo)}>
                  {shouldShowGameInfo ? <SVG.Image size="18px" /> : <SVG.Info height="18px" />}
                </div>
              </Tooltip>
            ) : null}
            <Tooltip
              title={this.state.gameUrlWasCopiedToClipboard ? 'Link copied!' : 'Copy Link'}
              arrow={true}
              duration={170}
              animation="fade"
              hideOnClick={false}>
              <div
                className={STYLES_LINK_BUTTON}
                style={{ borderLeft: isLocalFile ? null : '1px solid #CDCDCD' }}
                onMouseEnter={() => this._handleToggleHoverOnLink(true)}
                onMouseLeave={() => this._handleToggleHoverOnLink(false)}
                onClick={this._handleCopyUrlToClipboard}>
                {this.state.gameUrlWasCopiedToClipboard ? (
                  <div className={STYLES_COPY_LINK_CONTENTS}>
                    <SVG.Check size="24px" />
                  </div>
                ) : (
                  <div className={STYLES_COPY_LINK_CONTENTS}>
                    <SVG.Link size="24px" />
                  </div>
                )}
              </div>
            </Tooltip>
          </div>
        ) : null}
      </div>
    );
  }
}
