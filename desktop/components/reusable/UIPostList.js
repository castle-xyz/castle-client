import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';
import { getEmojiComponent } from '~/common/emojis';
import { Tooltip } from 'react-tippy';

const STYLES_CONTAINER = css`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-left: 12px;
`;

const STYLES_POST = css`
  width: 100%;
  margin: 0px 16px 16px 0px;
  padding: 10px 12px 4px 12px;
  max-width: 500px;
  min-height: 408px;
  display: inline-block;
  position: relative;
  color: black;
  background: ${Constants.colors.background};

  border-radius: ${Constants.card.radius};
  cursor: pointer;
  transition: 110ms ease-out transform;
  :hover {
    transition: 0ms ease-in transform;
    background: ${Constants.card.background};
    box-shadow: ${Constants.card.boxShadow};
  }
`;

const STYLES_MEDIA_IMAGE = css`
  width: 100%;
  height: 100%;
  cursor: pointer;
  background-color: black;
  background-size: contain;
  background-position: 50% 50%;
  background-repeat: no-repeat;
  min-height: 300px;
`;

const STYLES_POST_CARD = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const STYLES_POST_HEADER = css`
  display: flex;
  flex-direction: row;
  min-height: 38px;
  font-size: 15px;
  cursor: auto;
  padding-top: 4px;
  padding-bottom: 12px;
`;

const STYLES_MESSAGE_CONTAINER = css`
  max-width: 384px;
`;

const STYLES_PLAYING = css`
  white-space: nowrap;
  font-size: 15px;
  margin-top: 2px;
`;

const STYLES_PLAYING_TITLE = css`
  cursor: pointer;
  color: ${Constants.colors.action};
  margin-left: 0px;
  font-size: 15px;
  :hover {
    text-decoration: underline;
  }
`;

const STYLES_USER_PHOTO = css`
  background-size: cover;
  background-position: 50% 50%;
  height: 40px;
  width: 40px;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  :hover {
    filter: brightness(110%);
  }
`;

const STYLES_TEXT_CONTAINER = css`
  display: flex;
  flex-direction: column;
  margin-left: 12px;
`;

const STYLES_USER_NAME = css`
  font-family: ${Constants.font.system};
  font-weight: 700;
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`;

const STYLES_MESSAGE = css`
  margin-top: 2px;
  overflow-wrap: break-word;
`;

const STYLES_MESSAGE_SEE_MORE = css`
  color: ${Constants.colors.action};
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
`;

const STYLE_HEADER_TEXT_TOP_ROW = css`
  margin-top: 1px;
`;

const STYLES_FOOTER = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: 48px;
`;

const STYLES_TIMESTAMP = css`
  font-weight: 400;
  font-size: 12px;
  color: #b0b0b0;
`;

const STYLES_MESSAGE_MENTION = css`
  @keyframes color-change {
    from,
    20%,
    40%,
    60%,
    80%,
    to {
      animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    0% {
      opacity: 0;
      color: #000;
      transform: scale3d(0.3, 0.3, 0.3);
    }
    20% {
      transform: scale3d(1.1, 1.1, 1.1);
    }
    40% {
      transform: scale3d(0.9, 0.9, 0.9);
    }
    60% {
      opacity: 1;
      transform: scale3d(1.03, 1.03, 1.03);
    }
    80% {
      transform: scale3d(0.97, 0.97, 0.97);
    }
    to {
      opacity: 1;
      color: cyan;
      transform: scale3d(1, 1, 1);
    }
  }
  cursor: pointer;
  display: inline-block;
  font-weight: 900;
  color: cyan;
  animation: color-change 750ms;
  animation-iteration-count: 1;
`;

const STYLES_PLAY_ICON = css`
  width: 14px;
  height: 14px;
  color: ${Constants.card.iconColor};
  margin-left: auto;
  margin-right: 2px;
  :hover {
    transform: scale(1.14);
  }
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

class UIPostCell extends React.Component {
  static defaultProps = {
    game: null,
    onGameSelect: () => {},
    onUserSelect: () => {},
  };

  state = {
    mouseX: 0,
    mouseY: 0,
    urlWasCopiedToClipboard: false,
    isHoveringOnPost: false,
    isHoveringOnLink: false,
    stringIsElided: true,
  };

  // TODO(jason): consolidate w/ uigamecell
  _handleMouseMove = () => {
    let bounds = this._containerRef.getBoundingClientRect();
    let x = (100 * (event.clientX - bounds.left)) / bounds.width;
    let y = (100 * (event.clientY - bounds.top)) / bounds.height;

    this.setState({ mouseX: x, mouseY: y });
  };

  _handleExpandString = () => {
    this.setState({ stringIsElided: false });
  };

  _handleToggleHoverOnPost = (shouldSetHovering) => {
    this.setState({ isHoveringOnPost: shouldSetHovering });
  };

  _handleOpenData = async () => {
    const { post } = this.props;
    this.props.onGameSelect(post.sourceGame, { post });
  };

  _handleGameSelect = () => {
    this.props.onGameSelect(this.props.post.sourceGame);
  };

  _handleUserSelect = () => {
    this.props.onUserSelect(this.props.post.creator);
  };

  _handleToggleHoverOnLink = (shouldSetHovering) => {
    this.setState({ isHoveringOnLink: shouldSetHovering });
  };

  _handleMouseLeave = () => {
    this._handleToggleHoverOnPost(false);
    this.setState({ urlWasCopiedToClipboard: false });
  };

  _handleCopyUrlToClipboard = () => {
    let textField = document.createElement('textarea');
    textField.innerText = this.props.post.url;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
    this.setState({ urlWasCopiedToClipboard: true });
  };

  _renderMessage = (message) => {
    let result = [];
    for (let i = 0; i < message.length; i++) {
      let messagePart = message[i];
      if (messagePart.text) {
        if (this.state.stringIsElided && messagePart.text.length > 150) {
          result.push(
            <span key={i}>
              {Strings.elide(messagePart.text, 100)}
              <span className={STYLES_MESSAGE_SEE_MORE} onClick={this._handleExpandString}>
                {' '}
                see more
              </span>
            </span>
          );
          return result;
        } else {
          result.push(<span key={i}>{messagePart.text}</span>);
        }
      } else if (messagePart.userId) {
        let isRealUser = !!this.props.social.userIdToUser[messagePart.userId];
        let user = this.props.social.userIdToUser[messagePart.userId] || {
          userId: messagePart.userId,
          username: messagePart.userId,
        };

        result.push(
          <span
            key={i}
            className={STYLES_MESSAGE_MENTION}
            onClick={
              isRealUser ? () => this.props.navigateToUserProfile(user) : null
            }>{`@${user.username}`}</span>
        );
      } else if (messagePart.emoji) {
        result.push(<span key={i}>{getEmojiComponent(messagePart.emoji, 16)}</span>);
      }
    }

    return result;
  };

  _renderMessageContainer = (message, game) => {
    let richMessage = message ? this._renderMessage(message) : null;
    return <div className={STYLES_MESSAGE_CONTAINER}>{richMessage}</div>;
  };

  render() {
    const { post } = this.props;
    const { mouseX, mouseY } = this.state;
    const { sourceGame, creator, message, media, hasData, createdTime } = post;

    if (!media) {
      return null;
    }

    let onClick = null;
    if (hasData) {
      onClick = this._handleOpenData;
    } else if (sourceGame) {
      onClick = this._handleGameSelect;
    }

    let messageContainer = this._renderMessageContainer(message.message, sourceGame);

    const { urlWasCopiedToClipboard } = this.state;
    let svg;
    if (urlWasCopiedToClipboard) {
      svg = <SVG.Check size="18px" style={{ color: 'green' }} />;
    } else {
      svg = <SVG.Link size="18px" />;
    }

    let playing;
    if (sourceGame) {
      playing = (
        <span className={STYLES_PLAYING}>
          {'  \u2022  '}Playing{' '}
          <span className={STYLES_PLAYING_TITLE} onClick={this._handleGameSelect}>
            {sourceGame.title}
          </span>
        </span>
      );
    }

    return (
      <div
        className={STYLES_POST}
        ref={(c) => {
          this._containerRef = c;
        }}
        onMouseEnter={() => this._handleToggleHoverOnPost(true)}
        onMouseLeave={() => this._handleMouseLeave()}
        onMouseMove={this._handleMouseMove}
        style={{
          transform: this.state.isHoveringOnPost ? 'scale(1.004)' : 'scale(1.0)',
          background: this.state.isHoveringOnPost
            ? `radial-gradient(at ${mouseX}% ${mouseY}%, #FCFCFD, ${Constants.card.background})`
            : 'transparent',
        }}>
        <div className={STYLES_POST_CARD}>
          <div className={STYLES_POST_HEADER}>
            <div
              className={STYLES_USER_PHOTO}
              onClick={this._handleUserSelect}
              style={{
                backgroundImage:
                  creator.photo && creator.photo.url ? `url(${creator.photo.url})` : null,
              }}
            />
            <div className={STYLES_TEXT_CONTAINER}>
              <div className={STYLE_HEADER_TEXT_TOP_ROW}>
                <span className={STYLES_USER_NAME} onClick={this._handleUserSelect}>
                  {creator.username}
                </span>
                {playing}
              </div>
              <div className={STYLES_MESSAGE}>{messageContainer}</div>
            </div>
          </div>
        </div>
        <div
          className={STYLES_MEDIA_IMAGE}
          onClick={onClick}
          style={{
            backgroundImage: `url(${media.url})`,
          }}></div>

        <div className={STYLES_FOOTER}>
          <div
            className={STYLES_TIMESTAMP}
            style={{ visibility: this.state.isHoveringOnPost ? 'visible' : 'hidden' }}>
            {Strings.toCardDate(createdTime)}
          </div>
          <div
            className={
              this.state.isHoveringOnPost
                ? `${STYLES_PLAY_ICON} ${STYLES_PLAY_HOVER}`
                : STYLES_PLAY_ICON
            }>
            <SVG.Play size="32px" />
          </div>
        </div>

        {this.state.isHoveringOnPost ? (
          <div className={STYLES_OPTIONS_BAR}>
            <Tooltip
              title={this.state.urlWasCopiedToClipboard ? 'Link copied!' : 'Copy Link'}
              arrow={true}
              duration={170}
              animation="fade"
              hideOnClick={false}>
              <div
                className={STYLES_LINK_BUTTON}
                onMouseEnter={() => this._handleToggleHoverOnLink(true)}
                onMouseLeave={() => this._handleToggleHoverOnLink(false)}
                onClick={this._handleCopyUrlToClipboard}>
                {this.state.urlWasCopiedToClipboard ? (
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

export default class UIPostList extends React.Component {
  render() {
    const { posts } = this.props;
    return (
      <div className={STYLES_CONTAINER}>
        {posts.map((post) => {
          return (
            <UIPostCell
              key={post.postId}
              onGameSelect={this.props.onGameSelect}
              onUserSelect={this.props.onUserSelect}
              post={post}
            />
          );
        })}
      </div>
    );
  }
}
