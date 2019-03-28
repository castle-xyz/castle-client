import { NativeBinds } from '~/native/nativebinds';

let _nodeProcessConfig = null;

async function _runNodeProcessAsync() {
  if (_nodeProcessConfig) {
    return;
  }

  let nodeProcessConfigString = await NativeBinds.startNodeProcess();
  console.log(`nodeProcessConfigString: ${nodeProcessConfigString}`);
  _nodeProcessConfig = JSON.parse(nodeProcessConfigString);
  console.log(`parsed: ${_nodeProcessConfig}`);
}

export async function execNodeRpc(actionName, args) {
  await _runNodeProcessAsync();

  let response = await fetch(`http://localhost:${_nodeProcessConfig.port}/exec`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ secret: _nodeProcessConfig.secret, action: actionName, args }),
  });

  return await response.json();
}
