import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Actions from '~/common/actions';
import _ from 'lodash';

import { css } from 'react-emotion';

const DEBOUNCE_WAIT_MS = 50;
const DEBOUNCE_MAX_WAIT_MS = 100;

const STYLES_CONTAINER = css`
  position: relative;
  width: 100%;
  height: 0px;
`;

const STYLES_INNER_CONTAINER = css`
  position: absolute;
  bottom: 2px;
  padding: 6px 6px 6px 6px;
  border-radius: 4px;
  width: 100%;
  border: 1px solid ${Constants.colors.black};
  background: ${Constants.colors.white};
  font-size: 12px;
  width: 100%;
`;

const STYLE_RESULT_ROW = css`
  cursor: pointer;
  padding: 4px 4px 4px 4px;
  border-radius: 0px;
  width: 100%;
  color: ${Constants.colors.black};
  font-weight: 900;
  letter-spacing: 0.2px;
`;

const STYLE_RESULT_ROW_SELECTED = css`
  cursor: pointer;
  padding: 4px 4px 4px 4px;
  border-radius: 0px;
  width: 100%;
  color: ${Constants.colors.black};
  background: #aaa;
  font-weight: 900;
  letter-spacing: 0.2px;
`;

const STYLE_RESULT_ROW_REAL_NAME = css`
  margin-left: 40px;
  border-radius: 0px;
  width: 100%;
  color: #666;
`;

export default class ChatAutocomplete extends React.Component {
  static defaultProps = {
    text: null,
    onSelectUser: () => {},
    onChangeFocus: () => {},
    onFetchAutocomplete: () => {},
  };

  constructor(props) {
    super(props);

    this.state = {
      users: [],
      selectedRowIndex: 0,
    };

    this._autocompleteTextAsyncDebounced = _.debounce(
      this._autocompleteTextAsync,
      DEBOUNCE_WAIT_MS,
      {
        maxWait: DEBOUNCE_MAX_WAIT_MS,
      }
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.text !== prevProps.text) {
      this._autocompleteTextAsyncDebounced(this.props.text);
    }
  }

  _autocompleteTextAsync = async (text) => {
    let users = [];
    if (text && text.length > 0) {
      let autocompleteResults = await Actions.getAutocompleteAsync(text);
      users = autocompleteResults.users;

      this.props.onFetchAutocomplete(autocompleteResults);
    }

    // Some autocomplete queries might take longer than others, don't want to set the state to the result of an old query
    if (this.props.text === text) {
      if (this.state.users.length === 0 && users.length > 0) {
        this.props.onChangeFocus(true);
      }

      if (this.state.users.length > 0 && users.length === 0) {
        this.props.onChangeFocus(false);
      }

      this.setState({ users, selectedRowIndex: 0 });
    }
  };

  _setSelectedRow = (index) => {
    this.setState({
      selectedRowIndex: index,
    });
  };

  _renderUserRow = (user, index) => {
    let isSelected = index === this.state.selectedRowIndex;

    return (
      <div
        className={isSelected ? STYLE_RESULT_ROW_SELECTED : STYLE_RESULT_ROW}
        key={user.userId}
        onClick={() => this.props.onSelectUser(user)}
        onMouseMove={() => this._setSelectedRow(index)}>
        {user.username}
        <span className={STYLE_RESULT_ROW_REAL_NAME}>{user.name}</span>
      </div>
    );
  };

  onKeyDown = (e) => {
    let keyCode = e.keyCode;
    if (keyCode === 38) {
      // up arrow
      this.setState((state) => {
        return {
          selectedRowIndex: Math.max(0, state.selectedRowIndex - 1),
        };
      });

      e.preventDefault();
    } else if (keyCode == 40) {
      // down arrow
      this.setState((state) => {
        return {
          selectedRowIndex: Math.min(state.users.length - 1, state.selectedRowIndex + 1),
        };
      });

      e.preventDefault();
    } else if (keyCode == 13) {
      // enter
      if (
        this.state.selectedRowIndex >= 0 &&
        this.state.selectedRowIndex < this.state.users.length
      ) {
        this.props.onSelectUser(this.state.users[this.state.selectedRowIndex]);
        e.preventDefault();
      }
    } else if (keyCode == 27) {
      // escape
      this.setState({
        users: [],
      });
    }
  };

  render() {
    if (this.state.users.length === 0) {
      return null;
    }

    let rows = [];
    for (let i = 0; i < this.state.users.length; i++) {
      rows.push(this._renderUserRow(this.state.users[i], i));
    }

    return (
      <div className={STYLES_CONTAINER} style={this.props.style}>
        <div className={STYLES_INNER_CONTAINER} style={this.props.style}>
          {rows}
        </div>
      </div>
    );
  }
}
