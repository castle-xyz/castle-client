import { NativeBinds } from '~/native/nativebinds';
import * as Constants from '~/common/constants';
import * as Actions from '~/common/actions';

let publishPreviousHashes = {};

export async function publishProjectAsync(dir) {
  try {
    let token = await Actions.getAccessTokenAsync();
    let result = await ExecNode.execNodeAsync('publishProject', {
      dir,
      apiHost: Constants.API_HOST,
      token,
      previousHashes: publishPreviousHashes,
    });

    for (let i = 0; i < result.length; i++) {
      publishPreviousHashes[result[i]] = true;
    }
  } catch (e) {
    throw new Error(`failed to publish: ${e}`);
  }
}

export async function execNodeAsync(action, args) {
  let result = await NativeBinds.execNode({
    input: btoa(
      JSON.stringify({
        action,
        args,
      })
    ),
  });

  return JSON.parse(result);
}
