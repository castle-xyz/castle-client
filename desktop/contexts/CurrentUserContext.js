import * as React from 'react';

import * as Actions from '~/common/actions';

const CurrentUserContextDefaults = {
  user: null,
  timeLastLoaded: 0,
  userStatusHistory: [],
  setCurrentUser: (user) => {},
  clearCurrentUser: () => {},
  refreshCurrentUser: async () => {},
};

const CurrentUserContext = React.createContext(CurrentUserContextDefaults);

class CurrentUserContextProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...CurrentUserContextDefaults,
      ...props.value,
      setCurrentUser: this.setCurrentUser,
      clearCurrentUser: this.clearCurrentUser,
      refreshCurrentUser: this.refreshCurrentUser,
    };

    if (props.value && props.value.user) {
      this.state.timeLastLoaded = Date.now();
    }
  }

  setCurrentUser = (user) => {
    this.setState({
      user,
      timeLastLoaded: Date.now(),
    });
  };

  clearCurrentUser = () => {
    if (!Actions.logout()) {
      return;
    }
    this.setState({
      user: null,
      timeLastLoaded: 0,
      userStatusHistory: [],
    });
  };

  refreshCurrentUser = async () => {
    const viewer = await Actions.getViewer();
    if (!viewer) {
      return;
    }
    const userStatusHistory = await Actions.getUserStatusHistory(viewer.userId);
    this.setState({
      user: viewer,
      userStatusHistory,
      timeLastLoaded: Date.now(),
    });
  };

  render() {
    return (
      <CurrentUserContext.Provider value={this.state}>
        {this.props.children}
      </CurrentUserContext.Provider>
    );
  }
}

const CurrentUserContextConsumer = CurrentUserContext.Consumer;

export { CurrentUserContext, CurrentUserContextProvider, CurrentUserContextConsumer };
