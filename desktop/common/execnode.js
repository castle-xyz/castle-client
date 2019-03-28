import { NativeBinds } from '~/native/nativebinds';

export async function execNodeAsync(action, args) {
  let result = await NativeBinds.execNode({
    input: btoa(
      JSON.stringify({
        action,
        args,
      })
    ),
  });

  console.log(result);
  return JSON.parse(result);
}
