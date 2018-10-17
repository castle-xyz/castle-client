import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_LINK = css`
  color: ${Constants.colors.selected};
  text-decoration: underline;
  opacity: 1;
  transition: 200ms ease opacity;
  font-weight: 600;
  cursor: pointer;

  :visited {
    color: ${Constants.colors.green};
  }

  :hover {
    opacity: 0.8;
  }
`;

export default props => {
  return (
    <span
      href={props.href}
      target={props.target}
      onClick={props.onClick}
      children={props.children}
      className={STYLES_LINK}
    />
  );
};
