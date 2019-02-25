import * as React from 'react';
import _ from 'lodash';
import * as Constants from '~/common/constants';
import * as ChatUtils from '~/common/chatutils';
import ChatAutocomplete from '~/components/social/ChatAutocomplete';

import { css } from 'react-emotion';

import ControlledInput from '~/components/primitives/ControlledInput';

const SUBMIT_DELAY_AFTER_CLOSING_AUTOCOMPLETE_MS = 150;

const STYLES_CONTAINER = css`
  position: relative;
  padding: 0 4px 4px 4px;
`;

const STYLES_INPUT = css`
  display: block;
  box-sizing: border-box;
  padding: 0 4px 0 4px;
  border-radius: 0;
  width: 100%;
  border: 1px solid ${Constants.colors.black};
  background: ${Constants.colors.white};
  color: ${Constants.colors.black};
  font-size: 12px;
  height: 28px;
  margin: 0;

  :focus {
    outline: 0;
  }
`;

const STYLES_INPUT_READONLY = css`
  display: block;
  box-sizing: border-box;
  padding: 0 4px 0 4px;
  border-radius: 0;
  width: 100%;
  border: 1px solid ${Constants.colors.background4};
  background: ${Constants.colors.background};
  color: ${Constants.colors.background4};
  font-size: 12px;
  height: 28px;
  margin: 0;
  cursor: default;

  :focus {
    outline: 0;
  }
`;

export default class ChatInput extends React.Component {
  static defaultProps = {
    onFocus: () => {},
    onBlur: () => {},
    onSubmit: () => {},
  };

  state = {
    focus: false,
    inputValue: '',
    selectionStart: 0,
    autocompleteValue: '',
    ignoreSubmitUntil: null,
  };

  constructor(props) {
    super(props);

    this._chatAutocomplete = React.createRef();
    this._controllerInput = React.createRef();
    this._autocompleteCache = {
      users: {},
      games: {},
    };
  }

  _onFetchAutocomplete = (results) => {
    results.users.forEach((user) => {
      this._autocompleteCache.users[user.username] = user;
    });
  };

  _onSelectUserAsync = async (user) => {
    let cursorPosition = 0;

    await this.setState((state) => {
      let inputValue = state.inputValue;
      let selectionStart = state.selectionStart;

      // First find the beginning and end of the word that is using autocomplete
      let index = selectionStart - 1;
      while (index >= 0 && !/\s/.test(inputValue.charAt(index))) {
        index--;
      }
      let startOfWord = index + 1;
      index = selectionStart;
      while (index < inputValue.length && !/\s/.test(inputValue.charAt(index))) {
        index++;
      }
      let endOfWord = index;

      // Don't add an extra space if there's already a space after this user
      let optionalSpace = inputValue.substr(endOfWord).startsWith(' ') ? '' : ' ';

      // Update the input field and set the cursor to the end of the autocompleted word
      inputValue =
        inputValue.substr(0, startOfWord) +
        `@${user.username}${optionalSpace}` +
        inputValue.substr(endOfWord);
      cursorPosition = startOfWord + user.username.length + 2;

      return {
        inputValue,
        autocompleteValue: '',
      };
    });

    this._controllerInput.current.focus();
    this._controllerInput.current.getRef().setSelectionRange(cursorPosition, cursorPosition);
  };

  _onChangeInput = (event) => {
    let inputValue = event.target.value;
    let selectionStart = event.target.selectionStart;

    let autocompleteValue = '';

    let afterSelectionStart = inputValue.substr(selectionStart);
    // test if afterSelectionStart starts with whitespace
    let isCursorAtEndOfWord =
      afterSelectionStart.length === 0 ||
      !afterSelectionStart.startsWith(afterSelectionStart.trim());
    let currentWord = _.last(inputValue.substr(0, selectionStart).split(/\s/));

    if (isCursorAtEndOfWord && currentWord.startsWith('@')) {
      autocompleteValue = currentWord.substr(1);
    }

    this.setState({ inputValue, selectionStart, autocompleteValue });
  };

  _onSubmitAsync = async (e) => {
    e.preventDefault();

    if (this.state.ignoreSubmitUntil && new Date() < this.state.ignoreSubmitUntil) {
      return;
    }

    let formattedMessage = await ChatUtils.formatMessageAsync(
      this.state.inputValue,
      this._autocompleteCache
    );
    this.props.onSubmit(formattedMessage);
    this.setState({ inputValue: '' });
  };

  _handleFocus = (e) => {
    this.setState({ focus: true });
    this.props.onFocus(e);
  };

  _handleBlur = (e) => {
    this.setState({ focus: false });
    this.props.onBlur(e);
  };

  _onKeyDown = (e) => {
    this._chatAutocomplete.current.onKeyDown(e);
  };

  _onChangeAutocompleteFocus = (autocompleteHasFocus) => {
    if (!autocompleteHasFocus) {
      this.setState({
        ignoreSubmitUntil: new Date(
          new Date().getTime() + SUBMIT_DELAY_AFTER_CLOSING_AUTOCOMPLETE_MS
        ),
      });
    }
  };

  render() {
    const inputStyle = this.props.readOnly ? STYLES_INPUT_READONLY : STYLES_INPUT;
    return (
      <div className={STYLES_CONTAINER} style={this.props.style}>
        <ChatAutocomplete
          ref={this._chatAutocomplete}
          text={this.state.autocompleteValue}
          onSelectUser={this._onSelectUserAsync}
          onChangeFocus={this._onChangeAutocompleteFocus}
          onFetchAutocomplete={this._onFetchAutocomplete}
        />

        <ControlledInput
          ref={this._controllerInput}
          autoFocus={this.props.autoFocus}
          onChange={this._onChangeInput}
          onFocus={this._handleFocus}
          onBlur={this._handleBlur}
          onSubmit={this._onSubmitAsync}
          onKeyDown={this._onKeyDown}
          name={this.props.name}
          placeholder={this.props.placeholder}
          type={this.props.type}
          value={this.state.inputValue}
          readOnly={this.props.readOnly}
          className={inputStyle}
        />
      </div>
    );
  }
}
