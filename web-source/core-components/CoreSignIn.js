import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Actions from '~/common/actions';

import { css } from 'react-emotion';

import UIInput from '~/core-components/reusable/UIInput';
import UIButton from '~/core-components/reusable/UIButton';
import UIHeadingGroup from '~/core-components/reusable/UIHeadingGroup';

const STYLES_CONTAINER = css`
  @keyframes authentication-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: authentication-animation 280ms ease;

  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background ${Constants.colors.background};
  color: ${Constants.colors.white};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_TOP = css`
  display: flex;
  min-height: 25%;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const STYLES_BOTTOM = css`
  border-top: ${Constants.colors.border} 1px solid;
  color: ${Constants.colors.white};
  display: flex;
  align-items: center;
  height: 48px;
  width: 100%;
  flex-shrink: 0;
  padding: 0 18px 0 18px;
`;

const STYLES_CONTENTS = css`
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
`;

const STYLES_LINK = css`
  font-weight: 600;
  color: ${Constants.colors.subdued};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 24px;
  cursor: pointer;
  top: 8px;
  transition: 200ms ease color;

  :hover {
    color: ${Constants.colors.white};
  }
`;

const ENABLE_LEGAL = false;

export default class CoreSignIn extends React.Component {
  state = {
    username: '',
    password: '',
  };

  _handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  _handleSubmit = async () => {
    const user = await Actions.authenticate({
      username: this.state.username,
      password: this.state.password,
    });

    // TODO(jim): Error modal.
    if (!user) {
      window.alert('We could not sign you in, please try again.');
      return;
    }

    this.props.onSetViewer(user);
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_TOP}>
          <div className={STYLES_CONTENTS}>
            <UIHeadingGroup title="Welcome!">
              Enter your username and password to create a new account or sign into an existing one.
            </UIHeadingGroup>
            <UIInput
              autoFocus
              label="username"
              name="username"
              placeholder="Type a username..."
              onChange={this._handleChange}
              value={this.state.username}
            />
            <UIInput
              label="password"
              name="password"
              type="password"
              placeholder="Type a password..."
              onChange={this._handleChange}
              onSubmit={this._handleSubmit}
              value={this.state.password}
            />
            <UIButton onClick={this._handleSubmit}>Submit</UIButton>
          </div>
        </div>

        {ENABLE_LEGAL ? (
          <div className={STYLES_BOTTOM}>
            <span className={STYLES_LINK}>Terms of Service</span>
            <span className={STYLES_LINK}>Privacy Policy</span>
          </div>
        ) : null}
      </div>
    );
  }
}
