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
    console.log("_submitEmailAsyc");
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
    this.setState({ who: data.userForLoginInput });
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
      default:
        this.setState({ s: "WHO" });
        return this._renderWho();
    }
  }

  _renderPassword() {
    return <div />;
  }

  _renderSignup() {
    return <div />;
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
            type="email"
            placeholder="e-mail address or username"
            onChange={event => {
              this.setState({ email: event.target.value });
              console.log({ state: this.state });
            }}
          />
          <input type="submit" title="Continue" />
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
        </form>
      </div>
    );
  }
}
