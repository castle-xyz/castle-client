import throttle from 'lodash.throttle';

let logId = 1;

export const getLogs = () => {
  if (!window.cefQuery) {
    console.error('getLogs: window.cefQuery is undefined');
    return new Promise(resolve => resolve([]));
  }

  return new Promise(resolve => {
    window.cefQuery({
      request: JSON.stringify({
        name: 'readChannels',
        arg: { channelNames: ['PRINT', 'ERROR'] },
      }),
      onSuccess: json => {
        const channels = JSON.parse(json);

        const logs = [];
        channels.PRINT.map(json => {
          const params = JSON.parse(json);
          let logText;
          if (params && Array.isArray(params)) {
            logText = params.join(' ');
          } else {
            logText = '(nil)';
          }
          logs.push({ id: logId, type: 'print', text: `${logText}` });
          logId = logId + 1;
        });

        channels.ERROR.map(json => {
          const { error, stacktrace } = JSON.parse(json);
          logs.push({ id: logId, type: 'error', text: error, details: stacktrace });
          logId = logId + 1;
        });
        return resolve(logs);
      },
    });
  });
};

export const setMultiplayerSessionInfo = (info) => {
  if (!window.cefQuery) {
    console.error('setMultiplayerSessionInfo: window.cefQuery is undefined');
    return new Promise(resolve => resolve([]));
  }

  // DEMO FOR BEN -- TODO(ben): Remove
  window.cefQuery({
    request: JSON.stringify({
      name: 'hello',
      arg: { name: 'ben' },
    }),
    onSuccess: str => {
      alert(str);
    },
  });
  // DEMO ENDS HERE

  return new Promise(resolve => {
    window.cefQuery({
      request: JSON.stringify({
        name: 'writeChannels',
        arg: {
          channelData: {
            MULTIPLAYER_SESSION_INFO: [ // This name must match channel name query in Lua code
              JSON.stringify(info),
            ],
          },
        },
      }),
    });
  });
};

export const setBrowserReady = callback => {
  if (!window.cefQuery) {
    console.error('setBrowserReady: window.cefQuery is undefined');
    return;
  }

  try {
    window.cefQuery({
      request: JSON.stringify({
        name: 'browserReady',
        arg: {},
      }),
    });
  } catch (e) {
    alert('`cefQuery`: ' + e.message);
    return;
  }

  if (callback) {
    return callback();
  }
};

export const openWindowFrame = mediaUrl => {
  if (!window.cefQuery) {
    console.error('openWindowFrame: window.cefQuery is undefined');
    return;
  }

  try {
    window.cefQuery({
      request: JSON.stringify({
        name: 'openUri',
        arg: {
          uri: mediaUrl,
        },
      }),
    });
  } catch (e) {
    alert('`cefQuery`: ' + e.message);
  }
};

export const openExternalURL = externalUrl => {
  if (!window.cefQuery) {
    console.error('openExternalUrl: window.cefQuery is undefined');
    return;
  }

  try {
    window.cefQuery({
      request: JSON.stringify({
        name: 'openExternalUrl',
        arg: {
          url: externalUrl,
        },
      }),
    });
  } catch (e) {
    alert('`cefQuery`: ' + e.message);
  }
};

export const updateWindowFrame = rect => {
  if (!window.cefQuery) {
    console.error('updateWindowFrame: window.cefQuery is undefined');
    return;
  }

  try {
    window.cefQuery({
      request: JSON.stringify({
        name: 'setChildWindowFrame',
        arg: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      }),
    });
  } catch (e) {
    alert('`cefQuery`: ' + e.message);
  }
};

export const closeWindowFrame = () => {
  if (!window.cefQuery) {
    console.error('closeWindowFrame: window.cefQuery is undefined');
    return;
  }

  window.cefQuery({
    request: JSON.stringify({
      name: 'close',
      arg: '',
    }),
  });
};
