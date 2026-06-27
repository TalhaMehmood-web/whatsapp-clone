// Public realtime port — server side. Route handlers + lib/ helpers
// import only from here, never directly from an adapter. To swap
// providers later, add a new adapter under `adapters/` and a case below.
//
// Shape of the exposed API:
//
//   triggerToChat(chatId, event, payload) → Promise<void>
//   triggerToUser(userId, event, payload) → Promise<void>
//   authorizeSubscription({ socketId, channel, userId, userInfo })
//                                          → adapter-specific payload
//
// `triggerToChat` and `triggerToUser` are 1:1 replacements for the old
// `emitToChat` / `emitToUser` from `socket-server.js`. Same arg shape,
// same call sites — P4 swaps every import in `lib/` from socket-server
// to this module.

import { getServerProvider } from "./config.js";
import { chatChannel, userChannel } from "./channels.js";
import {
  authorizeSubscription as pusherAuthorize,
  triggerToChannel as pusherTrigger,
} from "./adapters/pusher-server.js";

function getServerAdapter() {
  const provider = getServerProvider();
  switch (provider) {
    case "pusher":
      return {
        trigger: pusherTrigger,
        authorize: pusherAuthorize,
      };
    default:
      throw new Error(`Unknown realtime provider: ${provider}`);
  }
}

export async function triggerToChat(chatId, event, payload) {
  if (!chatId) return;
  const { trigger } = getServerAdapter();
  await trigger(chatChannel(chatId), event, payload);
}

export async function triggerToUser(userId, event, payload) {
  if (!userId) return;
  const { trigger } = getServerAdapter();
  await trigger(userChannel(userId), event, payload);
}

// Raw trigger when the caller already has the fully-qualified channel
// name (e.g. `private-channel-abc123`). Used by lib/channels.js where
// the channel namespace is computed once and reused for multiple
// triggers. Avoids passing the chatId/userId pair through layers when
// a name is more natural.
export async function triggerToChannel(channelName, event, payload) {
  if (!channelName) return;
  const { trigger } = getServerAdapter();
  await trigger(channelName, event, payload);
}

export function authorizeSubscription(args) {
  const { authorize } = getServerAdapter();
  return authorize(args);
}
