import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

const STYLES_LINK = css`
  color: ${Constants.colors.green};
  opacity: 1;
  transition: 200ms ease opacity;
  cursor: pointer;

  :visited {
    color: ${Constants.colors.green};
  }

  :hover {
    opacity: 0.8;
  }
`;

export default props => {
  return <a {...props} className={STYLES_LINK} />;
};
