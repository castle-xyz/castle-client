import * as React from 'react';

/**
 *  DevelopmentContext contains the "making game" state of the app.
 */
const DevelopmentContextDefaults = {
  isDeveloping: false,
  logs: [],
  setIsDeveloping: () => {},
  addLogs: (logs) => {},
  clearLogs: () => {},
};

const DevelopmentContext = React.createContext(DevelopmentContextDefaults);

class DevelopmentContextProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...DevelopmentContextDefaults,
      setIsDeveloping: this.setIsDeveloping,
      addLogs: this.addLogs,
      clearLogs: this.clearLogs,
    };
  }

  setIsDeveloping = (isDeveloping) => {
    this.setState({
      isDeveloping,
    });
  };

  addLogs = (logs) => {
    this.setState({
      logs: [...this.state.logs, ...logs],
    });
  };

  clearLogs = () => {
    this.setState({
      logs: [],
    });
  };

  render() {
    return (
      <DevelopmentContext.Provider value={this.state}>
        {this.props.children}
      </DevelopmentContext.Provider>
    );
  }
}

const DevelopmentContextConsumer = DevelopmentContext.Consumer;

export { DevelopmentContext, DevelopmentContextProvider, DevelopmentContextConsumer };
