import * as ExecNode from '~/common/execnode';
import { NativeBinds } from '~/native/nativebinds';
import * as Bridge from '~/common/bridge';
import GameWindow from '~/native/gamewindow';

let cancelActiveScreenCapture = false;

export async function takeScreenCaptureAsync() {
  try {
    await NativeBinds.takeScreenCapture();
  } catch (e) {}
}

export async function screenCaptureUpdateEvent(e) {
  try {
    let updateType = e.params.type;

    if (updateType === 'startRecording') {
      GameWindow.setIsRecording(true);
    } else if (updateType === 'endRecording') {
      const navigations = GameWindow.getNavigations();
      navigations.navigateToLoadingScreenCapture({
        onCancel: () => {
          cancelActiveScreenCapture = true;

          // If there's an error anywhere we don't want this to persist to the next screen capture
          setTimeout(() => {
            cancelActiveScreenCapture = false;
          }, 10 * 1000);
        },
      });

      GameWindow.setIsRecording(false);
    } else if (updateType === 'completed') {
      if (cancelActiveScreenCapture) {
        cancelActiveScreenCapture = false;
        return;
      }

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
    }
  } catch (e) {}
}
