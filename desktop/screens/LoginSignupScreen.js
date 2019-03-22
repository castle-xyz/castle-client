import React from 'react';
import { css } from 'react-emotion';

import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';
import { CurrentUserContext } from '~/contexts/CurrentUserContext';
import * as Strings from '~/common/strings';

import UIInputSecondary from '~/components/reusable/UIInputSecondary';
import UIButton from '~/components/reusable/UIButton';
import UIHeading from '~/components/reusable/UIHeading';
import UILink from '~/components/reusable/UILink';
import UIUserPreview from '~/components/reusable/UIUserPreview';

const STYLES_CONTAINER = css`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  color: ${Constants.colors.black};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_CONTENTS = css`
  width: 100%;
  max-width: 528px;
  padding: 24px;
`;

const STYLES_SPACER = css`
  height: 16px;
`;

const STYLES_PARAGRAPH = css`
  color: ${Constants.colors.black};
  font-size: ${Constants.typescale.base};
  line-height: ${Constants.linescale.base};
  margin-top: 16px;
  margin-bottom: 12px;
`;

const STYLES_FOOTER = css`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  margin-top: 24px;
`;

const STYLES_ERROR_MESSAGE = css`
  flex-shrink: 0;
  display: block;
  padding-bottom: 24px;
  color: ${Constants.colors.error};
`;

const STYLES_ACTION = css`
  font-family: ${Constants.font.default};
  font-size: 16px;
  margin-top: 16px;
  margin-bottom: 16px;
  text-decoration: underline;
  cursor: pointer;
  color: ${Constants.colors.action};
  transition: 200ms ease color;

  :hover {
    color: ${Constants.colors.actionHover};
  }
`;

export default class LoginSignupScreen extends React.Component {
  static contextType = CurrentUserContext;

  // steps:
  //  WHO - input who you are
  //  PASSWORD - put in your password
  //  SIGNUP - create an account

  state = {
    who: '',
    password: '',
    email: '',
    name: '',
    username: '',
    step: 'WHO',

    whoSubmitEnabled: true,
    passwordSubmitEnabled: true,
    signupSubmitEnabled: true,

    localViewer: null,
    suggestedUser: null,

    signupError: null,
  };

  _goToSignup = () => {
    let s = {
      step: 'SIGNUP',
      signupSubmitEnabled: true,
    };

    let who = this.state.who;
    if (who && who.indexOf(' ') !== -1) {
      s.name = who;
    } else if (who && who.indexOf('@') !== -1) {
      s.email = who;
    } else if (who) {
      s.username = who;
    }
    this.setState(s);
  };

  _goToPassword = () => {
    this.setState({
      step: 'PASSWORD',
      passwordSubmitEnabled: true,
      loginError: null,
    });
  };

  _goToWho = () => {
    this.setState({
      step: 'WHO',
      whoSubmitEnabled: true,
    });
  };

  _goToSuccess = () => {
    this.setState({ step: 'SUCCESS' }, () => {
      this.context.setCurrentUser(this.state.localViewer);
    });
  };

  render() {
    switch (this.state.step) {
      case 'WHO':
        return this._renderWho();
      case 'PASSWORD':
        return this._renderPassword();
      case 'SIGNUP':
        return this._renderSignup();
      case 'SUCCESS':
        return <div />; // won't be seen because we redirect to profile
      default:
        return this._renderWho();
    }
  }

  _handlePasswordReset = async (e) => {
    if (!this.state.suggestedUser) {
      console.error('No suggested user');
      return;
    }

    if (!this.state.suggestedUser.userId) {
      console.error('no userId');
      return;
    }

    const response = await Actions.resetPassword({
      userId: this.state.suggestedUser.userId,
    });

    console.log(response);
  };

  _handleLoginAsync = async (e) => {
    e.preventDefault();

    if (!this.state.passwordSubmitEnabled) {
      return;
    }

    this.setState({ passwordSubmitEnabled: false });

    const user = await Actions.login({
      userId: this.state.suggestedUser.userId,
      password: this.state.password,
    });

    if (!user) {
      return;
    }

    if (user.errors) {
      if (user.errors.length > 0) {
        this.setState({
          passwordSubmitEnabled: true,
          loginError: user.errors[0].message,
        });
      }

      return;
    }

    this.setState({ localViewer: user }, this._goToSuccess);
  };

  _handleSubmitEmailAsync = async (e) => {
    e.preventDefault();

    if (!this.state.whoSubmitEnabled) {
      return;
    }

    this.setState({ whoSubmitEnabled: false });
    const user = await Actions.getExistingUser({ who: this.state.who });

    if (user) {
      this.setState({
        suggestedUser: user,
      });
      this._goToPassword();

      return;
    }

    this._goToSignup();
  };

  _handleSignUpAsync = async (e) => {
    e.preventDefault();

    if (!this.state.signupSubmitEnabled) {
      return;
    }

    this.setState({ signupSubmitEnabled: false });

    const response = await Actions.signup({
      name: this.state.name,
      username: this.state.username ? this.state.username.toLowerCase() : '',
      email: this.state.email ? this.state.email.toLowerCase() : '',
      password: this.state.password,
    });

    if (response.errors) {
      this.setState({
        signupError: response.errors[0].message,
        signupSubmitEnabled: true,
      });
    } else {
      let localViewer;

      if (response && response.data && response.data.signup) {
        localViewer = response.data.signup;
        this.setState({ localViewer, signupError: null }, this._goToSuccess);
        return;
      }

      if (!localViewer) {
        this.setState({
          signupError: "Server didn't respond with an user",
          signupSubmitEnabled: true,
        });
      }
    }
  };

  _handleChange = (e) => this.setState({ [e.target.name]: e.target.value });

  _renderPassword = () => {
    let maybeErrorNode;
    if (!Strings.isEmpty(this.state.loginError)) {
      maybeErrorNode = <h5 className={STYLES_ERROR_MESSAGE}>Error: {this.state.loginError}</h5>;
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <form onSubmit={this._handleLoginAsync}>
            <UIUserPreview user={this.state.suggestedUser} />
            <div className={STYLES_SPACER} />
            {maybeErrorNode}

            <UIInputSecondary
              key="login-password"
              autoFocus={true}
              label="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              onChange={this._handleChange}
              value={this.state.password}
            />
            <div className={STYLES_SPACER} />
            <UIButton onClick={this._handleLoginAsync}>Sign in</UIButton>
            <div className={STYLES_ACTION} onClick={this._handlePasswordReset}>
              → Reset Your Password
            </div>
          </form>

          <div className={STYLES_FOOTER}>
            Not {this.state.suggestedUser.name || '@' + this.state.suggestedUser.username}?{' '}
            <UILink onClick={this._goToWho}>Sign in</UILink> as someone else or{' '}
            <UILink onClick={this._goToSignup}>create a new account</UILink>.
          </div>
        </div>
      </div>
    );
  };

  _renderSignup = () => {
    let maybeErrorNode;
    if (!Strings.isEmpty(this.state.signupError)) {
      maybeErrorNode = <h5 className={STYLES_ERROR_MESSAGE}>Error: {this.state.signupError}</h5>;
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <form onSubmit={this._handleSignUpAsync}>
            <UIHeading>Create a Castle account</UIHeading>
            {maybeErrorNode}
            <UIInputSecondary
              autoFocus
              label="username"
              name="username"
              placeholder="Username"
              onChange={this._handleChange}
              value={this.state.username}
            />
            <div className={STYLES_SPACER} />
            <UIInputSecondary
              label="name"
              name="name"
              type="text"
              placeholder="Your name"
              onChange={this._handleChange}
              value={this.state.name}
            />
            <div className={STYLES_SPACER} />
            <UIInputSecondary
              label="email"
              name="email"
              type="email"
              noValidate
              placeholder="E-mail address"
              onChange={this._handleChange}
              value={this.state.email}
            />
            <div className={STYLES_SPACER} />
            <UIInputSecondary
              label="password"
              name="password"
              type="password"
              placeholder="New password"
              onChange={this._handleChange}
              value={this.state.password}
            />
            <div className={STYLES_SPACER} />
            <UIButton onClick={this._handleSignUpAsync}>Create Account</UIButton>
          </form>

          <div className={STYLES_FOOTER}>
            Already have an account? <UILink onClick={this._goToWho}>Sign in</UILink> instead.
          </div>
        </div>
      </div>
    );
  };

  _renderWho = () => {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <form onSubmit={this._handleSubmitEmailAsync}>
            <UIHeading>Sign in or create account</UIHeading>
            <div className={STYLES_PARAGRAPH}>
              Sign in or register with Castle to share and play games with the Castle community.
            </div>
            <UIInputSecondary
              value=""
              autoFocus
              label="Email or Username"
              name="who"
              placeholder=""
              onChange={this._handleChange}
              value={this.state.who}
            />
            <div className={STYLES_SPACER} />
            <UIButton
              type="submit"
              onFocus={this._handleSubmitEmailAsync}
              onClick={this._handleSubmitEmailAsync}>
              Continue
            </UIButton>
            <div className={STYLES_FOOTER}>
              You'll have another chance to review your info before submitting.
            </div>
          </form>
        </div>
      </div>
    );
  };
}
