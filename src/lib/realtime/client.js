"use client";

// Public realtime port — client side. Hooks (use-chat-sync,
// use-friend-requests-sync, etc.) import only from here, never directly
// from an adapter. To swap providers later, add a new adapter under
// `adapters/` and a case below.
//
// Shape of the exposed API:
//
//   connect({ accessToken, authEndpoint }) → handle | null
//   disconnect(handle)
//   subscribe(handle, channel, event, handler) → unsubscribe()
//   subscribePresence(handle, channel, handlers) → unsubscribe()
//   bindConnectionState(handle, onChange) → unbind()
//
// Plus channel-naming helpers re-exported so hooks don't import them
// from the channels module directly (one-stop import surface).

import { getClientProvider } from "./config.js";
import * as pusherClient from "./adapters/pusher-client.js";

function getClientAdapter() {
  const provider = getClientProvider();
  switch (provider) {
    case "pusher":
      return pusherClient;
    default:
      // Defensive fallback. Should never hit thanks to getClientProvider's
      // own fallback to "pusher".
      return pusherClient;
  }
}

export function connect(args) {
  return getClientAdapter().connect(args);
}

export function disconnect(handle) {
  return getClientAdapter().disconnect(handle);
}

export function subscribe(handle, channel, event, handler) {
  return getClientAdapter().subscribe(handle, channel, event, handler);
}

export function subscribePresence(handle, channel, handlers) {
  return getClientAdapter().subscribePresence(handle, channel, handlers);
}

export function bindConnectionState(handle, onChange) {
  return getClientAdapter().bindConnectionState(handle, onChange);
}

// Re-export the channel namers so hooks have a single import target.
export {
  channelChannel,
  chatChannel,
  userChannel,
  presenceChannel,
} from "./channels.js";
