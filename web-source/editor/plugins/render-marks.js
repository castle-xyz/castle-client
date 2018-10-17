import * as React from 'react';

import styled, { css } from 'react-emotion';

const STYLES_BOLD = css`
  font-weight: 600;
  letter-spacing: 0.2px;
`;

export default () => {
  return {
    renderMark(props) {
      const { children, mark } = props;
      switch (mark.type) {
        case 'bold':
          return <strong className={STYLES_BOLD}>{children}</strong>;
        case 'italic':
          return <em>{children}</em>;
        case 'underlined':
          return <u>{children}</u>;
        case 'strikethrough':
          return <s>{children}</s>;
      }
    },
  };
};
