import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import ControlledInput from '~/components/primitives/ControlledInput';

const STYLES_CONTAINER = css`
  position: relative;
`;

const STYLES_INPUT = css`
  display: block;
  box-sizing: border-box;
  padding: 16px 8px 0 8px;
  border-radius: 4px;
  width: 100%;
  border: 2px solid transparent;
  background: ${Constants.colors.white};
  color: ${Constants.colors.black};
  font-size: 16px;
  height: 64px;
  margin: 0 0 0 0;

  :focus {
    outline: 0;
    border: 2px solid transparent;
  }
`;

const STYLES_LABEL = css`
  color: ${Constants.colors.black};
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  left: 10px;
  top: 8px;
  position: absolute;
`;

export default class UIInputSecondary extends React.Component {
  static defaultProps = {
    onChange: () => {},
    onSubmit: () => {},
    onFocus: () => {},
    onBlur: () => {},
  };

  state = {
    focus: false,
  };

  _handleFocus = (e) => {
    this.setState({ focus: true });

    this.props.onFocus(e);
  };

  _handleBlur = (e) => {
    this.setState({ focus: false });

    this.props.onBlur(e);
  };

  render() {
    return (
      <div className={STYLES_CONTAINER} style={this.props.style}>
        <label className={STYLES_LABEL}>{this.props.label}</label>
        <ControlledInput
          autoFocus={this.props.autoFocus}
          onChange={this.props.onChange}
          onFocus={this._handleFocus}
          onBlur={this._handleBlur}
          onSubmit={this.props.onSubmit}
          name={this.props.name}
          placeholder={this.props.placeholder}
          type={this.props.type}
          value={this.props.value}
          className={STYLES_INPUT}
        />
      </div>
    );
  }
}
