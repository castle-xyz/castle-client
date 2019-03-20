import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Actions from '~/common/actions';

import { css } from 'react-emotion';

import UILogItem from '~/components/reusable/UILogItem';
import UINavigationLink from '~/components/reusable/UINavigationLink';

const STYLES_FIXED_CONTAINER = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background #020202;
  color: #FFFFFF;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);

  @keyframes fade-in-up {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: fade-in-up 200ms ease;
`;

const STYLES_LOGS_CONTAINER = css`
  display: flex;
  width: 100%;
  height: 100%;
`;

const STYLES_SCROLLING_LOGS = css`
  width: 100%;
  height: 100%;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_LOGS = css`
  padding: 0 24px 0 24px;
`;

const STYLES_LOG = css`
  font-family: ${Constants.font.mono};
  font-size: 10px;
  margin-bottom: 2px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const STYLES_LOG_LEFT = css`
  flex-shrink: 0;
  text-transform: uppercase;
  padding-right: 24px;
`;

const STYLES_LOG_RIGHT = css`
  min-width: 25%;
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const STYLES_MODE_SELECTOR = css`
  background: ${Constants.colors.backgroundNavigation};
  height: 32px;
  flex-shrink: 0;
`;

const STYLES_SPACER = css`
  height: 8px;
`;

const STYLES_ACTIONS = css`
  height: 34px;
  display: flex;
  align-items: center;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.07);
  padding: 0 24px 0 24px;
`;

const LogMode = {
  LOCAL: 0,
  REMOTE: 1,
};

export default class DevelopmentLogs extends React.Component {
  _logs;
  _scrollView;

  state = {
    logMode: LogMode.LOCAL,
    remoteLogs: [],
  };

  componentWillReceiveProps(nextProps) {
    const isBottom =
      this._scrollView.scrollHeight - this._scrollView.scrollTop === this._scrollView.clientHeight;
    const newItems = nextProps.logs.length > this.props.logs.length;

    // NOTE(jim): Only scroll if you're at the bottom with new items.
    if (isBottom && newItems) {
      this.scroll();
    }
  }

  componentDidMount() {
    this.scroll();
  }

  scroll = () => {
    window.setTimeout(() => {
      this._logs.scrollIntoView(false);
    });
  };

  _getLogColor = (log) => {
    if (log.type === 'error') {
      return Constants.logs.error;
    } else if (log.type === 'system') {
      return Constants.logs.system;
    }
    return Constants.logs.default;
  };

  _onSelectLocal = () => {
    this.setState({
      logMode: LogMode.LOCAL,
    });
  };

  _onSelectRemote = () => {
    this._fetchRemoteLogsAsync();

    this.setState({
      logMode: LogMode.REMOTE,
    });
  };

  _fetchRemoteLogsAsync = async () => {
    this.setState({
      remoteLogs: [],
    });

    let { game } = this.props;
    try {
      let remoteLogs = await Actions.gameServerLogsAsync(
        game.gameId,
        game.serverEntryPoint || game.url
      );
      if (remoteLogs) {
        this.setState({
          remoteLogs,
        });
      }
    } catch (e) {}
  };

  _renderLocalLogs = () => {
    return this.props.logs.map((l, i) => {
      return (
        <div
          className={STYLES_LOG}
          style={{ color: this._getLogColor(l) }}
          key={`development-log-${l.id}`}>
          <span className={STYLES_LOG_LEFT}>{l.type}</span>
          <div className={STYLES_LOG_RIGHT}>{l.details ? <UILogItem log={l} /> : l.text}</div>
        </div>
      );
    });
  };

  _renderRemoteLogs = () => {
    let logs = this.state.remoteLogs.map((l) => {
      let text = l.logs;
      try {
        if (text.charAt(0) == '[') {
          let json = JSON.parse(text);
          text = json.join(' ');
        }
      } catch (e) {}

      return (
        <div
          className={STYLES_LOG}
          style={{ color: l.is_lua ? Constants.logs.default : Constants.logs.system }}
          key={`remote-log-${l.id}`}>
          <span className={STYLES_LOG_LEFT}>
            {l.is_lua ? 'Lua' : 'System'} {l.timestamp}
          </span>
          <div className={STYLES_LOG_RIGHT}>{text}</div>
        </div>
      );
    });

    return [
      <div
        className={STYLES_LOG}
        style={{ color: Constants.logs.default, paddingBottom: '10px' }}
        key={`remote-log-warning}`}>
        Server logs are delayed by a few seconds. Please use the reload button to fetch the most up
        to date logs.
      </div>,
      ...logs,
    ];
  };

  _renderBottomActions = () => {
    switch (this.state.logMode) {
      case LogMode.LOCAL:
        return (
          <UINavigationLink style={{ marginRight: 24 }} onClick={this.props.onClearLogs}>
            Clear
          </UINavigationLink>
        );
      case LogMode.REMOTE:
        return (
          <UINavigationLink style={{ marginRight: 24 }} onClick={this._fetchRemoteLogsAsync}>
            Reload
          </UINavigationLink>
        );
    }
  };

  _renderLogModeSelector = () => {
    const { logMode } = this.state;
    if (this.props.game.metadata && !!this.props.game.metadata.multiplayer) {
      return (
        <React.Fragment>
          <UINavigationLink
            style={{ color: logMode == LogMode.LOCAL ? 'magenta' : null, marginRight: 24 }}
            onClick={this._onSelectLocal}>
            View local logs
          </UINavigationLink>
          <UINavigationLink
            style={{ color: logMode == LogMode.REMOTE ? 'magenta' : null, marginRight: 24 }}
            onClick={this._onSelectRemote}>
            View server logs
          </UINavigationLink>
        </React.Fragment>
      );
    }
  };

  render() {
    let { logMode } = this.state;

    return (
      <div className={STYLES_FIXED_CONTAINER}>
        <div className={STYLES_ACTIONS}>
          {this._renderBottomActions()} {this.props.viewSourceElement}{' '}
          {this._renderLogModeSelector()}
        </div>
        <div
          className={STYLES_SCROLLING_LOGS}
          ref={(c) => {
            this._scrollView = c;
          }}>
          <div className={STYLES_SPACER} />
          <div className={STYLES_LOGS}>
            {logMode == LogMode.LOCAL ? this._renderLocalLogs() : this._renderRemoteLogs()}
          </div>
          <div
            className={STYLES_SPACER}
            ref={(c) => {
              this._logs = c;
            }}
          />
        </div>
      </div>
    );
  }
}
