import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import ReactDOM from 'react-dom';
import regexMatch from 'react-string-replace';
import AutoSizeTextarea from 'react-textarea-autosize';
import ChatInputMention from '~/components/chat/ChatInputMention';

const STYLES_CONTAINER = css`
  flex-shrink: 0;
  width: 100%;
  padding: 0px 16px 8px 16px;
`;

const STYLES_MENTIONS = css`
  position: absolute;
  bottom: 50px;
  border-radius: 4px;
  border: 1px solid rgba(219, 219, 219, 1);
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  left: 16px;
  right: 16px;
  display: flex;
  flex-direction: column-reverse;
`;

const STYLES_INPUT = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  border: 2px solid ${Constants.REFACTOR_COLORS.elements.border};
  display: flex;
  width: 100%;
  height: 100%;
  outline: 0;
  font-size: 14px;
  background: transparent;
  font-weight: 400;
  padding: 8px 8px 8px 8px;
  box-sizing: border-box;
  resize: none;
  border-radius: 4px;
  transition: 200ms ease border;

  ::placeholder {
    color: #aaa;
  }

  :focus {
    border: 2px solid magenta;
    outline: 0;
  }
`;

export default class ChatInput extends React.Component {
  _input;

  static defaultProps = {
    theme: {
      textColor: null,
      inputBackground: null,
    },
    users: [],
  };

  state = {
    index: 0,
  };

  componentDidMount() {
    window.addEventListener('keyup', this._handleKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this._handleKeyUp);
  }

  focus = () => {
    const element = ReactDOM.findDOMNode(this._input);
    element.focus();
  };

  _handleSelectUser = (user, clicked) => {
    let newValue = this.props.value;
    let mention = `@${user.username}`;

    // NOTE(jim): Regex only captures at the end of the string as you type.
    newValue = regexMatch(newValue, /([@][\w_-]+)$/g, (match, i) => {
      return `@${user.username}`;
    });

    // NOTE(jim): Sometimes the regex adds extra characters around a successful mention.
    this.props.onForceChange({
      value: newValue.join().replace(`,${mention},`, mention),
      users: [],
    });

    // NOTE(jim): If we are not going to lose focus, don't do
    // anything.
    if (!clicked) {
      return;
    }

    // NOTE(jim): When we click, we lose focus. so we have
    // to regain it.
    this.focus();
  };

  _handleKeyDown = (e) => {
    // NOTE(jim): Prevent default up and down for multiline textarea
    if (this.props.users.length && (e.which === 38 || e.which === 40)) {
      e.preventDefault();
      return;
    }

    // NOTE(jim): Prevent default return response when a user is navigating the popover.
    if (this.state.index > -1 && this.props.users.length && e.which === 13) {
      e.preventDefault();

      this._handleSelectUser(this.props.users[this.state.index]);
      this.setState({ index: 0 });
      return;
    }

    // NOTE(jim): Prevent default return response when a user is navigating the popover.
    if (this.state.index > -1 && this.props.users.length && e.which === 9) {
      e.preventDefault();

      this._handleSelectUser(this.props.users[this.state.index]);
      this.setState({ index: 0 });
      return;
    }

    this.props.onKeyDown(e);
  };

  _handleKeyUp = (e) => {
    const { index } = this.state;
    const { users } = this.props;

    if (!users.length) {
      return;
    }

    if (e.which === 38) {
      e.preventDefault();
      this.setState({
        index: index < users.length - 1 ? index + 1 : users.length - 1,
      });
      return;
    }

    if (e.which === 40) {
      e.preventDefault();
      this.setState({ index: index > -1 ? index - 1 : -1 });
      return;
    }
  };

  render() {
    const { users } = this.props;
    const { index } = this.state;

    let inputStyles;
    let containerStyles;
    if (this.props.isSidebarGameInput) {
      containerStyles = {
        padding: 0,
      };

      inputStyles = {
        border: `2px solid transparent`,
        padding: `8px 16px 8px 16px`,
        borderRadius: `0px`,
        color: this.props.theme.textColor,
        background: this.props.theme.inputBackground,
      };
    }

    return (
      <div className={STYLES_CONTAINER} style={containerStyles}>
        {users.length ? (
          <div className={STYLES_MENTIONS}>
            {users.map((o, i) => {
              return (
                <ChatInputMention
                  onClick={() => this._handleSelectUser(o, true)}
                  user={o}
                  key={`option-${i}`}
                  isSelected={i === index}
                />
              );
            })}
          </div>
        ) : null}
        <AutoSizeTextarea
          ref={(c) => {
            this._input = c;
          }}
          className={STYLES_INPUT}
          autoComplete="off"
          placeholder={this.props.placeholder}
          name={this.props.name}
          value={this.props.value}
          onChange={this.props.onChange}
          onKeyDown={this._handleKeyDown}
          style={inputStyles}
        />
      </div>
    );
  }
}
