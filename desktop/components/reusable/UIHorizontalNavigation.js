import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_ROW = css`
  display: flex;
  padding-left: 8px;
  background: #e0dbda;
`;

const STYLES_NAVIGATION_ITEM = css`
  font-family: ${Constants.font.heading};
  user-select: none;
  padding: 16px;
  cursor: pointer;
  font-size: ${Constants.typescale.base};
`;

class UINavigationItem extends React.Component {
  render() {
    const { label, key } = this.props.item;
    return (
      <div
        className={STYLES_NAVIGATION_ITEM}
        style={{
          marginRight: 16,
          color: this.props.selected ? Constants.colors.text : Constants.colors.text2,
        }}
        onClick={() => this.props.onSelect(key)}>
        {label}
      </div>
    );
  }
}

export default class UIHorizontalNavigation extends React.Component {
  _onSelect = (key) => {
    if (this.props.onChange) {
      this.props.onChange(key);
    }
  };

  render() {
    const { items } = this.props;
    return (
      <div className={STYLES_ROW}>
        {items.map((item) => {
          return (
            <UINavigationItem
              key={item.key}
              item={item}
              selected={item.key === this.props.selectedKey}
              onSelect={this._onSelect}
            />
          );
        })}
      </div>
    );
  }
}
