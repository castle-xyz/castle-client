import * as ExecNode from '~/common/execnode';

import { NativeBinds } from '~/native/nativebinds';

export async function takeScreenCaptureAsync() {
  try {
    /*let event = new Event('CASTLE_ADD_CHAT_NOTIFICATION');
    event.params = {
      message: 'Processing screen capture...',
    };
    window.dispatchEvent(event);*/
    console.log('screen capture starting...');

    await NativeBinds.takeScreenCapture();
  } catch (e) {}
}

export async function screenCaptureReadyEvent(e) {
  try {
    let result = await ExecNode.uploadScreenCaptureAsync(e.params.path);
    if (!result.mp4Url || !result.gifUrl) {
      return;
    }

    /*let event = new Event('CASTLE_ADD_CHAT_NOTIFICATION');
    event.params = {
      message: `Here is a gif of your screen capture: ${result.gifUrl}`,
    };
    window.dispatchEvent(event);*/
    console.log(result.gifUrl);
  } catch (e) {}
}
