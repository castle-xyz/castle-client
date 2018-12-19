// JS-facing native module that lets you interact with Love Channels
// (https://love2d.org/wiki/Channel). This is the main way of achieving JS <-> Lua communication.
//
// Each method takes a `name` parameter to select the channel as given to `love.thread.getChannel`
// (https://love2d.org/wiki/love.thread.getChannel).
//
// Implemented by 'GhostChannels.mm'.

import { NativeModules } from 'react-native';

// Clears all the messages in the Channel queue.
export function clearAsync(name) {
  return NativeModules.GhostChannels.clearAsync(name);
}

// Wait for and retrieve the value of a Channel message. `options.timeout` is optional and
// specifies a maximum amount of time to wait.
export function demandAsync(name, options = {}) {
  return NativeModules.GhostChannels.demandAsync(name, options);
}

// Retrieves the number of messages in the Channel queue.
export function getCountAsync(name) {
  return NativeModules.GhostChannels.getCountAsync(name);
}

// Gets whether a pushed value has been popped or otherwise removed from the Channel. `id` is as
// returned by `.pushAsync` for that value.
export function hasReadAsync(name, id) {
  return NativeModules.GhostChannels.hasReadAsync(name, id);
}

// Receive a message from a thread Channel, but leave it in the queue. `undefined` if there's
// no message in the queue.
export function peekAsync(name) {
  return NativeModules.GhostChannels.peekAsync(name);
}

// Retrieve the value of a Channel message and remove it from the queue. `undefined` if there's no
// message in the queue.
export function popAsync(name) {
  return NativeModules.GhostChannels.popAsync(name);
}

// Retrieve an array of values popped from a Channel till it is exhausted. May not return adjacently
// pushed messages if the Channel is also being popped from on other threads. May loop infinitely if
// values are being simultaneously being added to the Channel as fast or faster than they are being
// popped.
export function popAllAsync(name) {
  return NativeModules.GhostChannels.popAllAsync(name);
}

// Send a message to a Channel. Returns its `id`.
export function pushAsync(name, value) {
  return NativeModules.GhostChannels.pushAsync(name, value);
}

// Send a message to a Channel and wait for a thread to accept it. `options.timeout` specifies a
// maximum amount of time to wait. Returns whether the message was accepted within the timeout
// (always `true` if no timeout given).
export function supplyAsync(name, value, options = {}) {
  return NativeModules.GhostChannels.supplyAsync(name, value, options);
}

// Call `handler` when a message arrives at a Channel. `handler` is called with the message as the
// only parameter. Call `.remove()` on the returned value to unsubscribe.
export function on(name, handler) {
  const interval = setInterval(async () => {
    (await popAllAsync(name)).forEach(handler);
  });

  return {
    remove() {
      clearInterval(interval);
    },
  };
}
