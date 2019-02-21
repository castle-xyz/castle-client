import * as React from 'react';

const SocialContextDefaults = {
  userIdToUser: {},
  onlineUserIds: {},
  addUser: (user) => {},
  addUsers: (users) => {},
  setOnlineUserIds: (userIds) => {},
};

const SocialContext = React.createContext(SocialContextDefaults);

class SocialContextProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...SocialContextDefaults,
      ...props.value,
      addUser: this.addUser,
      addUsers: this.addUsers,
      setOnlineUserIds: this.setOnlineUserIds,
    };
  }

  addUser = (user) => {
    this.setState((state) => {
      state.userIdToUser[user.userId] = user;
      return {
        ...state,
        userIdToUser: state.userIdToUser,
      };
    });
  };

  addUsers = (users) => {
    this.setState((state) => {
      users.forEach((user) => {
        state.userIdToUser[user.userId] = user;
      });

      return {
        ...state,
        userIdToUser: state.userIdToUser,
      };
    });
  };

  setOnlineUserIds = (userIds) => {
    this.setState({
      onlineUserIds: userIds,
    });
  };

  render() {
    return (
      <SocialContext.Provider value={this.state}>{this.props.children}</SocialContext.Provider>
    );
  }
}

const SocialContextConsumer = SocialContext.Consumer;

export { SocialContext, SocialContextProvider, SocialContextConsumer };
