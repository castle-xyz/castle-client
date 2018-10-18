import React from "react";
import { css } from "react-emotion";

import { API } from "~/common/actions";
import * as Constants from "~/common/constants";

import UIInput from "~/core-components/reusable/UIInput";
import UIButton, { UIInputSubmit } from "~/core-components/reusable/UIButton";
import UIHeadingGroup from "~/core-components/reusable/UIHeadingGroup";
import UILink from "~/core-components/reusable/UILink";
import { transparentGifDataUrl, base } from "../common/constants";

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

export default class CoreLoginSignup extends React.Component {
  // states:
  //  WHO - input who you are
  //  PASSWORD - put in your password
  //  SIGNUP - create an account
  state = {
    who: "",
    password: "",
    email: "",
    name: "",
    username: "",
    s: "WHO",

    whoSubmitEnabled: true,
    passwordSubmitEnabled: true,
    signupSubmitEnabled: true
  };

  async _submitEmailAsync() {
    if (!this.state.whoSubmitEnabled) {
      return;
    }
    this.setState({ whoSubmitEnabled: false });
    console.log("_submitEmailAsync");
    let { data } = await API.graphqlAsync(
      /* GraphQL */ `
        query($who: String!) {
          userForLoginInput(who: $who) {
            userId
            name
            username
            photo {
              imgixUrl
              height
              width
            }
          }
        }
      `,
      { who: this.state.who }
    );
    let user = data.userForLoginInput;
    if (user) {
      this.setState({
        loginUser: user
      });
      this._goToPassword();
    } else {
      this._goToSignup();
    }
  }

  _goToSignup() {
    let s = {
      s: "SIGNUP",
      signupSubmitEnabled: true
    };

    let who = this.state.who;
    if (who && who.indexOf(" ") !== -1) {
      s.name = who;
    } else if (who && who.indexOf("@") !== -1) {
      s.email = who;
    } else if (who) {
      s.username = who;
    }
    this.setState(s);
  }

  _goToPassword() {
    this.setState({
      s: "PASSWORD",
      passwordSubmitEnabled: true
    });
  }

  _goToWho() {
    this.setState({
      s: "WHO",
      whoSubmitEnabled: true
    });
  }

  render() {
    switch (this.state.s) {
      case "WHO":
        return this._renderWho();
      case "PASSWORD":
        return this._renderPassword();
      case "SIGNUP":
        return this._renderSignup();
      case "SUCCESS":
        return this._renderSuccess();
      default:
        this.setState({ s: "WHO" });
        return this._renderWho();
    }
  }

  async _loginAsync() {
    if (!this.state.passwordSubmitEnabled) {
      return;
    }
    this.setState({ passwordSubmitEnabled: false });
    console.log("_loginAsync called");
    let result = await API.graphqlAsync(
      /* GraphQL */ `
        mutation($userId: ID!, $password: String!) {
          login(userId: $userId, password: $password) {
            userId
            username
            name
            email
            photo {
              height
              width
              url
            }
          }
        }
      `,
      {
        userId: this.state.loginUser.userId,
        password: this.state.password
      }
    );
    let { data } = result;
    if (data.login) {
      this.setState({ loggedInUser: data.login });
      this._goToSuccess();
    } else {
      // console.log({ result });
      // console.error(result.errors[0].message);
      if (result.errors.length > 0) {
        this.setState({
          passwordSubmitEnabled: true,
          loginError: result.errors[0].message
        });
      }
    }
  }

  _goToSuccess() {
    console.log("success");
    if (this.props.onLogin && typeof this.props.onLogin === "function") {
      this.props.onLogin(this.state.loggedInUser);
    }
    this.setState({ s: "SUCCESS" });
  }

  async _signupAsync() {
    if (!this.state.signupSubmitEnabled) {
      return;
    }
    this.setState({ signupSubmitEnabled: false });
    console.log("_signupAsync");
    let result = await API.graphqlAsync(
      /* GraphQL */ `
        mutation(
          $name: String!
          $username: String!
          $email: String!
          $password: String!
        ) {
          signup(
            user: { name: $name, username: $username }
            email: $email
            password: $password
          ) {
            userId
            username
            name
            email
            photo {
              height
              width
              url
            }
          }
        }
      `,
      {
        name: this.state.name,
        username: this.state.username,
        email: this.state.email,
        password: this.state.password
      }
    );
    if (result.data.signup) {
      this.setState({ loggedInUser: result.data.signup });
      this._goToSuccess();
    } else {
      // Handle errors
    }
  }

  _renderSuccess() {
    let imgSrc = transparentGifDataUrl;
    if (this.state.loginUser.photo && this.state.loginUser.photo.imgixUrl) {
      imgSrc = this.state.loginUser.photo.imgixUrl;
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_TOP}>
          <div className={STYLES_CONTENTS}>
            <UIHeadingGroup title="Successfully signed in">
              <img
                style={{
                  height: 64,
                  width: 64,
                  float: "left",
                  marginRight: 15,
                  borderRadius: 4
                }}
                src={imgSrc}
              />
              <h3>{this.state.loginUser.name}</h3>
              <h5>{"@" + this.state.loginUser.username}</h5>
            </UIHeadingGroup>
          </div>
        </div>
      </div>
    );
  }

  _renderPassword() {
    let imgSrc = transparentGifDataUrl;
    if (this.state.loginUser.photo && this.state.loginUser.photo.imgixUrl) {
      imgSrc = this.state.loginUser.photo.imgixUrl;
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_TOP}>
          <div className={STYLES_CONTENTS}>
            <form
              onSubmit={event => {
                event.preventDefault();
                this._loginAsync();
              }}
            >
              <UIHeadingGroup title="Sign in">
                <img
                  style={{
                    height: 64,
                    width: 64,
                    float: "left",
                    marginRight: 15,
                    borderRadius: 4
                  }}
                  src={imgSrc}
                />
                <h3>{this.state.loginUser.name}</h3>
                <h5>{"@" + this.state.loginUser.username}</h5>
              </UIHeadingGroup>
              <UIInput
                key="login-password"
                autoFocus={true}
                label="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                onChange={event => {
                  this.setState({ password: event.target.value });
                }}
                value={this.state.password}
              />
              {this.state.loginError && (
                <h5
                  style={{
                    paddingBottom: 24,
                    color: base.red
                  }}
                >
                  {this.state.loginError}
                </h5>
              )}
              <UIInputSubmit
                value="Login"
                onClick={event => {
                  event.preventDefault();
                  this._loginAsync();
                }}
              />
            </form>
          </div>
        </div>
        <p />
        <p>
          Not {this.state.loginUser.name || "@" + this.state.loginUser.username}
          ?{" "}
          <UILink
            onClick={event => {
              event.preventDefault();
              this._goToWho();
            }}
          >
            Sign in as someone else
          </UILink>{" "}
          or{" "}
          <UILink
            onClick={event => {
              event.preventDefault();
              this._goToSignup();
            }}
          >
            Create a new account
          </UILink>
        </p>
        <p />
        <p>
          Forgot your password?
          <UILink
            onClick={event => {
              event.preventDefault();
              alert(
                "Not implemented yet! :( E-mail ccheever@expo.io to get it reset"
              );
            }}
          >
            &nbsp;Reset it
          </UILink>
        </p>
      </div>
    );
  }

  _renderSignup() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_TOP}>
          <div className={STYLES_CONTENTS}>
            <form
              onSubmit={event => {
                event.preventDefault();
                this._signupAsync();
              }}
            >
              <UIHeadingGroup title="Create a Castle account" />
              <UIInput
                autoFocus
                label="username"
                name="username"
                placeholder="Username"
                onChange={event => {
                  this.setState({ username: event.target.value });
                }}
                value={this.state.username}
              />
              <UIInput
                label="name"
                name="name"
                type="text"
                placeholder="Your name"
                onChange={event => {
                  this.setState({ name: event.target.value });
                }}
                value={this.state.name}
              />
              <UIInput
                label="email"
                name="email"
                type="email"
                noValidate={true}
                placeholder="E-mail address"
                onChange={event => {
                  this.setState({ email: event.target.value });
                }}
                value={this.state.email}
              />

              <UIInput
                label="password"
                name="password"
                type="password"
                placeholder="New password"
                onChange={event => {
                  this.setState({ password: event.target.value });
                }}
                value={this.state.password}
              />
              <UIButton
                onClick={() => {
                  this._signupAsync();
                }}
              >
                Create Account
              </UIButton>
            </form>
          </div>
        </div>
        <p>
          Already have an account?{" "}
          <UILink
            onClick={() => {
              this._goToWho();
            }}
          >
            Sign in instead
          </UILink>
        </p>
      </div>
    );
  }

  _renderWho() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_TOP}>
          <div className={STYLES_CONTENTS}>
            <form
              onSubmit={event => {
                event.preventDefault();
                this._submitEmailAsync();
              }}
            >
              <UIHeadingGroup title="What's your e-mail address?" />
              <UIInput
                value=""
                autoFocus={true}
                label="email"
                name="email"
                placeholder="E-mail or username or phone #"
                onChange={event => {
                  this.setState({ who: event.target.value });
                }}
                value={this.state.who}
              />
              <UIInputSubmit
                value="Next"
                onFocus={event => {
                  this._submitEmailAsync();
                }}
                onClick={event => {
                  event.preventDefault();
                  this._submitEmailAsync();
                }}
              />
            </form>
          </div>
        </div>
      </div>
    );
  }
}
