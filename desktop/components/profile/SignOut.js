import * as React from 'react';
import * as Constants from '~/common/constants';

import { css } from 'react-emotion';

import UIButton from '~/components/reusable/UIButton';

const STYLES_CONTAINER = css`
  color: ${Constants.colors.black};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const STYLES_PARAGRAPH = css`
  color: ${Constants.colors.black};
  font-size: ${Constants.typescale.base};
  line-height: ${Constants.linescale.base};
  margin-bottom: 16px;
`;

const STYLES_CONTENT = css`
  max-width: 480px;
  padding: 64px 32px 32px 32px;
  flex-direction: column;
  box-sizing: border-box;
`;

export default class SignOut extends React.Component {
  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENT}>
          <div className={STYLES_PARAGRAPH}>Are you sure you want to sign out of Castle?</div>
          <UIButton onClick={this.props.onSignOut}>Sign out</UIButton>
        </div>
      </div>
    );
  }
}
