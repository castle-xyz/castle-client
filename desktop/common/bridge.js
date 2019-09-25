import * as uuid from 'uuid/v4';
import * as Actions from '~/common/actions';
import * as NativeUtil from '~/native/nativeutil';
import * as Urls from '~/common/urls';
import * as ExecNode from '~/common/execnode';

import md5 from 'md5';
import Logs from '~/common/logs';
import GameWindow from '~/native/gamewindow';
import Storage from '~/common/storage';

///
/// Data conversion
///

export const jsUserToLuaUser = async (user) =>
  user
    ? {
        userId: user.userId,
        username: user.username,
        name: user.name,
        photoUrl: user.photo ? user.photo.url : undefined,
      }
    : undefined;

export const jsPostToLuaPost = async ({ postId, creator, media }, { data }) => ({
  postId,
  creator: await jsUserToLuaUser(creator),
  mediaUrl: media ? media.url : undefined,
  data: data ? await Actions.postDataAsync({ postId }) : undefined,
});

export const jsGameToLuaGame = async ({ gameId, owner, title, url, description }) => ({
  gameId,
  owner: await jsUserToLuaUser(owner),
  title,
  url,
  description,
});

///
/// LUA -> JS -> LUA
///

const storage = new Storage('castle');
let localStorageKey = storage.getItem('localStorageKey');
if (!localStorageKey) {
  localStorageKey = uuid();
  storage.setItem('localStorageKey', localStorageKey);
}

// Utility: get the `storageId` for a registered game or generate one if unregistered
const storageIdForCurrentGame = () => {
  const currentGame = GameWindow.getCurrentGame();
  if (!currentGame) {
    throw new Error('Global storage needs a running game');
  }
  if (currentGame.storageId) {
    return currentGame.storageId;
  } else {
    const url = currentGame.url;
    if (Urls.isPrivateUrl(url)) {
      return md5(localStorageKey + url);
    } else {
      return md5(url);
    }
  }
};

// Methods callable as `bridge.js.<methodName>(arg)` from Lua. Can be `async `. Should be called from
// a network coroutine in Lua. Blocks the coroutine till a response (return value, error thrown,
// promise resolution or rejection) is received.
export const JS = {
  // Test method called by 'ghost-tests'
  async sayHello({ name }) {
    if (name !== 'l') {
      Logs.system(`responding 'hello, ${name}' in 2 seconds...`);
      await Actions.delay(2000);
      return `js: hello, ${name}!`;
    } else {
      Logs.system(`throwing an error in 2 seconds...`);
      await Actions.delay(2000);
      throw new Error("js: 'l' not allowed!");
    }
  },

  // Game

  async gameLoad({ gameIdOrUrl, params }) {
    const currentGame = GameWindow.getCurrentGame();
    const navigations = GameWindow.getNavigations();

    const options = { gameParams: params, referrerGame: currentGame, launchSource: 'game' };

    if (gameIdOrUrl.includes('://')) {
      navigations.navigateToGameUrl(gameIdOrUrl, options);
    } else {
      const game = await Actions.getGameByGameId(gameIdOrUrl);
      navigations.navigateToGame(game, options);
    }
  },

  // Storage

  async storageGetGlobal({ key }) {
    const storageId = storageIdForCurrentGame();
    const result = await Actions.getGameGlobalStorageValueAsync({ storageId, key });
    return result ? result.value : null;
  },

  async storageSetGlobal({ key, value }) {
    const storageId = storageIdForCurrentGame();
    const result = await Actions.setGameGlobalStorageAsync({
      storageId,
      key,
      value: value === undefined ? null : value, // Normalize to `null` for deletes
    });
    if (!result) {
      throw new Error('Global storage write failed!');
    }
  },

  async storageGetUser({ key }) {
    const storageId = storageIdForCurrentGame();
    const result = await Actions.getGameUserStorageValueAsync({ storageId, key });
    return result ? result.value : null;
  },

  async storageSetUser({ key, value }) {
    const storageId = storageIdForCurrentGame();
    const result = await Actions.setGameUserStorageAsync({
      storageId,
      key,
      value: value === undefined ? null : value, // Normalize to `null` for deletes
    });
    if (!result) {
      throw new Error('User storage write failed!');
    }
  },

  // Post

  async postCreate({ message, mediaType, mediaPath, mediaFileId, mediaUploadParams, data }) {
    // Get the current game and make sure it has a `.gameId` (is registered)
    const currentGame = GameWindow.getCurrentGame();
    const navigations = GameWindow.getNavigations();
    if (!currentGame || !navigations) {
      throw new Error('Post creation needs a running game');
    }
    if (!currentGame.gameId) {
      throw new Error(
        'Post creation needs the running game to have a `gameId` -- is it registered?'
      );
    }

    // Is a capture requested?
    if (mediaType === 'capture') {
      ({ path: mediaPath } = await Lua.captureScreenshot());
    }

    // Let user edit the message and confirm posting, or cancel
    let cancelled = false;
    let resolved = false;
    let editedMediaBlob;
    await new Promise((resolve, reject) =>
      navigations.navigateToEditPost({
        editPost: {
          message,
          mediaPath,
          shouldCrop: mediaType === 'capture',
        },
        onSubmit: (editPost) => {
          if (!resolved) {
            resolved = true;
            ({ message, mediaPath, editedMediaBlob } = editPost);
            resolve();
          }
        },
        onCancel: () => {
          if (!resolved) {
            resolved = true;
            cancelled = true;
            resolve();
          }
        },
      })
    );
    if (cancelled) {
      return null;
    }

    // Upload the media
    if (!mediaFileId) {
      if (editedMediaBlob) {
        mediaFileId = (await Actions.uploadImageAsync({ file: editedMediaBlob })).fileId;
      } else if (mediaPath) {
        mediaFileId = (await ExecNode.uploadFileAsync(mediaPath, mediaUploadParams)).fileId;
      }
    }

    // Create the post!
    return await Actions.createPostAsync({
      sourceGameId: currentGame.gameId,
      message,
      mediaFileId,
      data,
    });
  },

  async postGet({ postId, data }) {
    const jsPost = await Actions.getPostById(postId);
    return jsPost ? jsPostToLuaPost(jsPost, { data }) : null;
  },
};

// Listen for JS call requests from Lua
const onReceiveJSCallRequest = async (e) => {
  const response = { id: e.params.id };
  try {
    const methodName = e.params.methodName;
    const method = JS[methodName];
    if (!method) {
      throw new Error(`Unknown method '${methodName}'`);
    }
    response.result = await method(e.params.arg);
  } catch (err) {
    response.error = err.toString();
  }
  NativeUtil.sendLuaEvent('JS_CALL_RESPONSE', response);
};

///
/// JS -> LUA -> JS
///

// Keep track of calls we've sent to Lua and are waiting on for a response
let nextLuaCallId = 1;
const waitingLuaCalls = {};

// Make a Lua call to `bridge.lua.<methodName>(arg)` in 'bridge.lua', awaiting a return value or error
const luaCall = async (methodName, arg) => {
  return new Promise((resolve, reject) => {
    const id = nextLuaCallId++;
    waitingLuaCalls[id] = { resolve, reject };
    NativeUtil.sendLuaEvent('LUA_CALL_REQUEST', { id, methodName, arg });
  });
};

// Convenience object so you can just do `Bridge.Lua.<methodName>(arg)`
export const Lua = new Proxy(
  {},
  {
    get(self, name) {
      if (name in self) {
        // Memoize
        return self[name];
      } else {
        const wrapper = async (arg) => await luaCall(name, arg);
        self[name] = wrapper;
        return wrapper;
      }
    },
  }
);

// Listen for Lua call responses from Lua
const onReceiveLuaCallResponse = async (e) => {
  const response = e.params;
  const waitingCall = waitingLuaCalls[response.id];
  delete waitingLuaCalls[response.id];
  if (waitingCall) {
    if (response.error) {
      waitingCall.reject(response.error);
    } else {
      waitingCall.resolve(response.result);
    }
  }
};

///
/// Bind handlers
///

export const addEventListeners = () => {
  window.addEventListener('JS_CALL_REQUEST', onReceiveJSCallRequest);
  window.addEventListener('LUA_CALL_RESPONSE', onReceiveLuaCallResponse);
};

export const removeEventListeners = () => {
  window.removeEventListener('JS_CALL_REQUEST', onReceiveJSCallRequest);
  window.removeEventListener('LUA_CALL_RESPONSE', onReceiveLuaCallResponse);
};
