import { NativeBinds } from '~/native/nativebinds';
import * as ExecNode from '~/common/execnode';

export async function takeScreenCaptureAsync() {
  try {
    let event = new Event('CASTLE_ADD_CHAT_NOTIFICATION');
    event.params = {
      message: 'Processing screen capture...',
    };
    window.dispatchEvent(event);

    await NativeBinds.takeScreenCapture();
  } catch (e) {}
}

export async function screenCaptureReadyEvent(e) {
  try {
    let result = await ExecNode.uploadScreenCaptureAsync(e.params.path);
    if (!result.mp4Url || !result.gifUrl) {
      return;
    }

    let event = new Event('CASTLE_ADD_CHAT_NOTIFICATION');
    event.params = {
      message: `Here is a gif of your screen capture: ${result.gifUrl}`,
    };
    window.dispatchEvent(event);
  } catch (e) {}
}
