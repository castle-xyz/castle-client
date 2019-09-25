import * as ExecNode from '~/common/execnode';
import { NativeBinds } from '~/native/nativebinds';
import * as Bridge from '~/common/bridge';

export async function takeScreenCaptureAsync() {
  try {
    await NativeBinds.takeScreenCapture();
  } catch (e) {}
}

export async function screenCaptureReadyEvent(e) {
  try {
    let result = await ExecNode.uploadScreenCaptureAsync(e.params.path);

    let gifFile = null;
    for (let i = 0; i < result.length; i++) {
      if (result[i].type === 'gif') {
        gifFile = result[i].file;
        break;
      }
    }

    if (!gifFile) {
      return;
    }

    await Bridge.JS.postCreate({
      message: 'I recorded a video!',
      mediaPath: gifFile.url,
      mediaFileId: gifFile.fileId,
    });
  } catch (e) {}
}
