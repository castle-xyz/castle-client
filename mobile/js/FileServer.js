// JS-facing native module that lets you create a WebDAV server from any directory in the file
// system. All local file or directory references are in the form of 'file://' URIs as specified by
// the Expo file system API (https://docs.expo.io/versions/v29.0.0/sdk/filesystem).
//
// WebDAV servers can be easily accessed from macOS:
// https://support.apple.com/kb/PH25331?locale=en_US
//
// Implemented by 'FileServer.m'.

import { NativeModules, NativeEventEmitter } from 'react-native';

// Start the WebDAV server if not already running. `options.directory` must specify a local URI
// to a directory to server from.
export function startAsync(options = {}) {
  return NativeModules.FileServer.startAsync(options);
}

// Stop the WebDAV server if running.
export function stopAsync() {
  return NativeModules.FileServer.stopAsync();
}

const emitter = new NativeEventEmitter(NativeModules.FileServer);

// `handler` is called with `{ url }` after the server has successfully started.
export function onStart(handler) {
  return emitter.addListener('start', handler);
}

// `handler` is called with `{ url }` when Bonjour registration for the server is successfully
// completed. Call `.remove()` on the returned value to unsubscribe.
export function onBonjour(handler) {
  return emitter.addListener('bonjour', handler);
}

// `handler` is called with `{ item }` when a remote has downloaded a file from the server. Call
// `.remove()` on the returned value to unsubscribe.
export function onSend(handler) {
  return emitter.addListener('send', handler);
}

// `handler` is called with when an edit has occurred on the server by a remote. The handler is
// passed an argument with one of 5 shapes ...
//
//     `{ type: 'upload', item }`: A file has been uploaded
//     `{ type: 'move', from, to }`: A file or directory has been movied
//     `{ type: 'copy', from, to }`: A file or directory has been copied
//     `{ type: 'delete', item }`: A file or directory has been deleted
//     `{ type: 'createDirectory', item }`: A directory has been created
//
// ... where `item`, `from` or `to` are 'file://' URIs to the paths involved.
//
// Call `.remove()` on the returned value to unsubscribe.
export function onChange(handler) {
  return emitter.addListener('change', handler);
}
