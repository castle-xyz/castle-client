import React from "react";
import { API } from "~/common/actions";

export default class CoreLoginSignup extends React.Component {
  // states:
  //  WHO - input who you are
  //  PASSWORD - put in your password
  //  SIGNUP - create an account
  state = {
    email: null,
    s: "WHO"
  };

  async _submitEmailAsync() {
    let { data } = await API.graphqlAsync(
      /* GraphQL */ `
        query($who: String!) {
          userForLoginInput(who: $who) {
            userId
            name
            username
            photo {
              url
              height
              width
            }
          }
        }
      `,
      { who: this.state.email }
    );
    let user = data.userForLoginInput;
    if (user) {
      this.setState({
        s: "PASSWORD",
        who: user
      });
    } else {
      let s = {
        s: "SIGNUP"
      };
      let email = this.state.email;
      if (email && email.indexOf(" ") !== -1) {
        console.log("Think you put in a name", email, email.indexOf(" "));
        s.name = email;
      } else if (email && email.indexOf("@") !== -1) {
        s.signupEmail = email;
      } else if (email) {
        s.username = email;
      }
      this.setState(s);
    }
    console.log("who", data.userForLoginInput);
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
    console.log("_loginAsync called");
    let result = await API.graphqlAsync(
      /* GraphQL */ `
        mutation($userId: ID!, $password: String!) {
          login(userId: $userId, password: $password) {
            userId
            username
            name
            photo {
              height
              width
              url
            }
          }
        }
      `,
      {
        userId: this.state.who.userId,
        password: this.state.password
      }
    );
    let { data } = result;
    if (data.login) {
      console.log("success");
      this.setState({ loggedInUser: data.login, s: "SUCCESS" });
    } else {
      console.error();
    }
  }

  async _signupAsync() {
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
          }
        }
      `,
      {
        name: this.state.name,
        username: this.state.username,
        email: this.state.signupEmail,
        password: this.state.password
      }
    );
    console.log({ result });
  }

  _renderSuccess() {
    return (
      <div
        style={{
          color: "white"
        }}
      >
        You are logged in!
      </div>
    );
  }

  _renderPassword() {
    return (
      <div>
        {this.state.who && (
          <div style={{ color: "white" }}>
            <div>{this.state.who.name}</div>
            <div>@{this.state.who.username}</div>
            <div>
              <img
                src={this.state.who.photo.url}
                style={{ height: 200, width: 200 }}
              />
            </div>
          </div>
        )}
        <form
          onSubmit={event => {
            event.preventDefault();
            this._loginAsync();
          }}
        >
          <input
            key="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            onChange={event => {
              this.setState({ password: event.target.value });
            }}
          />
          <input key="login-submit" type="submit" title="Login" />
        </form>

        <a
          href="#"
          style={{
            color: "white",
            fontSize: 12
          }}
          onClick={event => {
            event.preventDefault();
            this.setState({
              s: "WHO"
            });
          }}
        >
          Login as a different user
        </a>
      </div>
    );
  }

  _renderSignup() {
    return (
      <div>
        <form
          onSubmit={event => {
            event.preventDefault();
            this._signupAsync();
          }}
        >
          <p>
            <input
              key="signup-username"
              name="username"
              type="text"
              placeholder="Your username on Castle"
              value={this.state.username}
              onChange={event => {
                this.setState({ username: event.target.value });
              }}
            />
          </p>
          <p>
            <input
              key="signup-name"
              name="name"
              type="text"
              placeholder="Your name to display to other users"
              value={this.state.name}
              onChange={event => {
                this.setState({ name: event.target.value });
              }}
            />
          </p>
          <p>
            <input
              key="signup-email"
              name="signupEmail"
              type="email"
              noValidate={true}
              placeholder="E-mail address"
              value={this.state.signupEmail}
              onChange={event => {
                this.setState({ signupEmail: event.target.value });
              }}
            />
          </p>
          <p>
            <input
              key="signup-password"
              name="password"
              type="password"
              placeholder="Pick a password"
              value={this.state.password}
              onChange={event => {
                this.setState({ password: event.target.value });
              }}
            />
          </p>
          <p>
            <input
              type="submit"
              key="signup-submit"
              name="signup"
              value="Signup"
            />
          </p>

          <a
            href="#"
            onClick={event => {
              event.preventDefault();
              this.setState({ s: "WHO" });
            }}
          >
            Already have an account and want to login?
          </a>
        </form>
      </div>
    );
  }

  _renderWho() {
    return (
      <div>
        <form
          onSubmit={event => {
            event.preventDefault();
            this._submitEmailAsync();
          }}
          noValidate={true}
        >
          <h3
            style={{
              color: "white"
            }}
          >
            E-mail Address
          </h3>

          <input
            key="who-email"
            type="email"
            placeholder="e-mail address or username"
            onChange={event => {
              this.setState({ email: event.target.value });
            }}
          />
          <input key="who-continue" type="submit" title="Continue" />
        </form>
      </div>
    );
  }
}
