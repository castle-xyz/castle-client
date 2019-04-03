import { NativeBinds } from '~/native/nativebinds';

export async function takeScreenCaptureAsync() {
  try {
    await NativeBinds.takeScreenCapture();
  } catch (e) {}
}
