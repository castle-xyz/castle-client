import { NativeBinds } from '~/native/nativebinds';
import * as ExecNode from '~/common/execnode';

export async function takeScreenCaptureAsync() {
  try {
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
      message: result.gifUrl,
    };
    window.dispatchEvent(event);
  } catch (e) {}
}
