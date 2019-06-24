import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';
import * as SVG from '~/components/primitives/svg';

import { css } from 'react-emotion';

import ControlledInput from '~/components/primitives/ControlledInput';

const STYLES_CONTAINER = css`
  color: ${Constants.colors.black};
  background: ${Constants.colors.white};
  box-shadow: inset 1px 0 2px -1px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 10%;
  width: 100%;
  padding: 8px;
`;

const STYLES_CONTAINER_LEFT = css`
  color: ${Constants.colors.white};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-right: 8px;
  padding-left: 10px;
`;

const STYLES_CONTAINER_MIDDLE = css`
  min-width: 25%;
  width: 100%;
  padding-right: 16px;
  display: flex;
  align-items: center;
  position: relative;
`;

const STYLES_DISMISS_AREA = css`
  top: 0px;
  right: 16px;
  bottom: 0px;
  position: absolute;
`;

const STYLES_INPUT = css`
  font-family: ${Constants.font.default};
  color: ${Constants.colors.black};
  font-size: 20px;
  display: flex;
  min-width: 25%;
  width: 100%;
  border: 0;
  box-sizing: border-box;
  outline: 0;
  margin: 0;

  :focus {
    border: 0;
    outline: 0;
  }
`;

const STYLES_INPUT_READONLY = css`
  background: ${Constants.colors.background3};
  font-size: 24px;
  border-radius: 3px;
  padding: 4px 12px 4px 12px;
  cursor: default;
`;

export default class SearchInput extends React.Component {
  static defaultProps = {
    query: '',
  };

  _input;

  _handleFocusInput = () => this._input.focus();

  render() {
    let queryElement;
    if (this.props.readOnly) {
      queryElement = <p className={STYLES_INPUT_READONLY}>{this.props.query}</p>;
    } else {
      queryElement = (
        <ControlledInput
          ref={(c) => {
            this._input = c;
          }}
          className={STYLES_INPUT}
          value={this.props.query}
          name={this.props.name}
          placeholder="Search Castle or enter URL"
          onSubmit={this.props.onSubmit}
          onChange={this.props.onChange}
          style={{ paddingRight: 32 }}
        />
      );
    }
    return (
      <div className={STYLES_CONTAINER}>
        <div
          className={STYLES_CONTAINER_LEFT}
          onClick={this.props.readOnly ? this.props.onSearchReset : this._handleFocusInput}>
          <SVG.SearchBarIcon height="32px" color="#c1bcbb" />
        </div>
        <div className={STYLES_CONTAINER_MIDDLE}>
          {queryElement}
          {!Strings.isEmpty(this.props.query) ? (
            <span className={STYLES_DISMISS_AREA} onClick={this.props.onSearchReset}>
              <SVG.Dismiss height="24px" style={{ marginLeft: 8 }} />
            </span>
          ) : null}
        </div>
      </div>
    );
  }
}
