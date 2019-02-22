import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

export default class ControlledInput extends React.Component {
  state = {
    focus: false,
  };

  _input;

  static defaultProps = {
    onChange: () => {},
    onSubmit: () => {},
    onKeyDown: () => {},
    onKeyUp: () => {},
    onBlur: () => {},
    onFocus: () => {},
  };

  componentDidMount = () => {
    if (this.props.autoFocus) {
      this._input.focus();
    }
  };

  focus = (e) => {
    this._input.focus();
    this._handleFocus(e);
  };

  blur = (e) => {
    this._input.blur();
    this._handleBlur(e);
  };

  getRef = () => {
    return this._input;
  };

  _handleFocus = (e) => {
    this.setState({ focus: true });
    this.props.onFocus(e);
  };

  _handleBlur = (e) => {
    this.setState({ focus: false });
    this.props.onBlur(e);
  };

  _handleKeyDown = (e) => {
    this.props.onKeyDown(e);
  };

  _handleKeyUp = (e) => {
    if (e.which === 13) {
      this.props.onSubmit(e);
      return;
    }

    this.props.onKeyUp(e);
  };

  componentDidMount = () => {
    if (this.props.autoFocus) {
      this._input.focus();
    }
  };

  render() {
    return (
      <input
        ref={(r) => {
          this._input = r;
        }}
        id={this.props.name ? `${this.props.name}-unique-input` : null}
        autoComplete="off"
        autoFocus={this.props.autoFocus}
        readOnly={this.props.readOnly}
        className={this.props.className}
        placeholder={this.props.placeholder}
        onChange={this.props.onChange}
        onFocus={this._handleFocus}
        onBlur={this._handleBlur}
        onKeyDown={this._handleKeyDown}
        onKeyUp={this._handleKeyUp}
        value={this.props.value}
        name={this.props.name}
        type={this.props.type}
      />
    );
  }
}
