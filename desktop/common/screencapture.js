import { NativeBinds } from '~/native/nativebinds';

export async function takeScreenCaptureAsync() {
  try {
    await NativeBinds.takeScreenCapture();
  } catch (e) {}
}

export async function screenCaptureReadyEvent(e) {
  window.alert(e.params.path);
}
