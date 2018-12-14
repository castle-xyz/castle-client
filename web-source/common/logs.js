import * as Urls from '~/common/urls';

const REMOTE_LOGS_POLL_INTERVAL_SEC = 5;
const DUMMY_REMOTE_LOGS = `{"id": 1967513926, "time": "Thu Dec 13 20:47:02 2018", "port": 22132, "logs": ["75ms","GET","https:\/\/raw.githubusercontent.com\/pkulchenko\/serpent\/522a6239f25997b101c585c0daf6a15b7e37fad9\/src\/serpent.lua"]}
{"id": 1365180540, "time": "Thu Dec 13 20:47:02 2018", "port": 22132, "logs": ["107ms","GET","https:\/\/raw.githubusercontent.com\/jesseruder\/triangle_warz\/b89e4045f8a2a36c760ce043e133a2903ac38e8a\/state.lua"]}`;

class Logs {
  _logs = null;
  _logId = 0;

  _remoteLogsUrl = null;
  _remoteLogsPollInterval = null;
  _lastRemoteLogIdSeen = 0;
  
  constructor() {
    this._logs = [];
  }

  print = (text) => {
    this._logs.push({
      type: 'print',
      text,
      id: this._logId++,
    });
  };

  error = (error, stacktrace) => {
    this._logs.push({
      type: 'error',
      text: error,
      details: stacktrace,
      id: this._logId++,
    });
  };

  system = (text) => {
    this._logs.push({
      type: 'system',
      text,
      id: this._logId++,
    });
  };

  remote = (text) => {
    this._logs.push({
      type: 'remote',
      text,
      id: this._logId++,
    });
  };

  consume = () => {
    const result = [ ...this._logs ];
    this._logs = [];
    return result;
  };

  /** remote logs **/

  startPollingForRemoteLogs = (mediaUrl) => {
    // clear any existing state
    this.stopPollingForRemoteLogs();

    if (!Urls.isLocalUrl(mediaUrl)) {
      this._remoteLogsUrl = `https://s3-us-west-2.amazonaws.com/castle-server-logs/logs-${encodeURIComponent(mediaUrl)}`;
      this._remoteLogsPollInterval = setInterval(
        this._pollForRemoteLogsAsync,
        REMOTE_LOGS_POLL_INTERVAL_SEC * 1000
      );
    }
  };

  stopPollingForRemoteLogs = () => {
    if (this._remoteLogsUrl) {
      this._remoteLogsUrl = null;
    }
    if (this._remoteLogsPollInterval) {
      clearInterval(this._remoteLogsPollInterval);
      this._remoteLogsPollInterval = null;
    }
    this._lastRemoteLogIdSeen = 0;
  };

  _pollForRemoteLogsAsync = async () => {
    console.log('polling for remote logs...');
    console.log(`url polled is: ${this._remoteLogsUrl}`);
    let remoteLogsFetched;
    try {
      const response = await fetch(this._remoteLogsUrl);
      let responseText = await response.text();
      // let responseText = DUMMY_REMOTE_LOGS;
      console.log(`response text is: ${responseText}`);
      remoteLogsFetched = responseText.split(/\r?\n/).map(line => JSON.parse(line));
    } catch (e) {
      // silently fail, try again next time
      console.log(`error polling: ${e}`);
    }

    if (remoteLogsFetched) {
      console.log(`fetched ${remoteLogsFetched.length} remote logs`);

      // resume after last seen log id, or start from the beginning if not found
      for (let ii = 0; ii < remoteLogsFetched.length; ii++) {
        const log = remoteLogsFetched[ii];
        if (log.id && log.id === this._lastRemoteLogIdSeen)  {
          remoteLogsFetched = remoteLogsFetched.slice(ii + 1);
          break;
        }
      }

      // format and pipe through this.remote()
      remoteLogsFetched.forEach(log => {
        const text = log.logs.join(' ');
        this.remote(text);
        this._lastRemoteLogIdSeen = log.id;
      });
    }
  };
}

export default new Logs();
