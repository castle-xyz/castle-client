import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as Actions from '~/common/actions';

import { css } from 'react-emotion';

import UIMessageBody from '~/components/reusable/UIMessageBody';

const STYLES_CONTAINER = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
  width: 100%;
  padding: 16px 24px 0 16px;
`;

const STYLES_AVATAR = css`
  flex-shrink: 0;
  background-size: cover;
  background-position: 50% 50%;
  height: 20px;
  width: 20px;
  cursor: pointer;
  border-radius: 4px;
`;

const STYLES_RIGHT = css`
  padding-left: 6px;
  min-width: 15%;
  width: 100%;
`;

const STYLES_AUTHOR_MESSAGE = css`
  font-weight: 400;
  line-height: 20px;
  font-size: 14px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  font-family: ${Constants.font.castle};
  color: ${Constants.REFACTOR_COLORS.text};
`;

export default class ChatMessageElement extends React.Component {
  static defaultProps = {
    user: {
      name: 'Anonymous',
      photo: {
        url: null,
      },
    },
    theme: {
      textColor: null,
    },
  };

  render() {
    const { message } = this.props;
    let isEmojiMessage = message.isEmojiMessage;

    return (
      <div className={STYLES_CONTAINER}>
        <span
          className={STYLES_AVATAR}
          onClick={
            this.props.user.username
              ? () => this.props.onNavigateToUserProfile(this.props.user)
              : () => {}
          }
          style={{ backgroundImage: this.props.user ? `url(${this.props.user.photo.url})` : `` }}
        />
        <span className={STYLES_RIGHT}>
          <div className={STYLES_AUTHOR_MESSAGE} style={{ color: this.props.theme.textColor }}>
            {this.props.user.username}{' '}
            <UIMessageBody body={message.body} theme={this.props.theme} />
          </div>
        </span>
      </div>
    );
  }
}
