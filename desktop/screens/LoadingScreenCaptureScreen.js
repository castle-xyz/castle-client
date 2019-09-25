import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIHeading from '~/components/reusable/UIHeading';

const STYLES_CONTAINER = css`
  flex: 1
  background: ${Constants.colors.background};
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  padding: 24px;
  align-items: center;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_SIZER = css`
  max-width: 600px;
`;

export default class LoadingScreenCaptureScreen extends React.Component {
  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_SIZER}>
          <UIHeading>Processing video...</UIHeading>
        </div>
      </div>
    );
  }
}
