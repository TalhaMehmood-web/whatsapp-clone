// Pusher server adapter. Implements the realtime port's server contract:
//   triggerToChannel(channel, event, payload) → Promise<void>
//   authorizeSubscription({ socketId, channel, userId, userInfo })
//                         → adapter-specific signed payload
//
// Feature code never imports this directly. It goes through
// `lib/realtime/server.js`, which picks the adapter based on
// REALTIME_PROVIDER. Keeps the swap-cost low when we add an Ably or
// Supabase adapter later — only `lib/realtime/server.js` changes.

import Pusher from "pusher";
import { isPresenceChannel } from "../channels.js";

let client = null;

// Lazily instantiate so a missing env var doesn't crash module load on
// import (e.g. during prisma migrate). Errors surface at first trigger
// instead, which is exactly when an op would notice them.
function getClient() {
  if (client) return client;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Pusher is not configured. Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER in .env.",
    );
  }
  client = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return client;
}

// Fire-and-forget triggers. Pusher's HTTPS API accepts a single channel
// or an array; we only ever target one channel per call so route
// handlers stay simple. Throwing here would block the API response on
// a CDN hiccup, so we swallow errors and log them — the DB write
// already succeeded and is the canonical state.
export async function triggerToChannel(channel, event, payload) {
  try {
    await getClient().trigger(channel, event, payload);
  } catch (err) {
    // `pusher-http-node` returns a typed error with `.status` on 4xx/5xx.
    console.warn("pusher trigger failed", {
      channel,
      event,
      status: err?.status,
      message: err?.message,
    });
  }
}

// Sign a client's subscription request. Pusher's auth handshake:
//   1. Client subscribes to `private-…` or `presence-…` channel.
//   2. pusher-js POSTs { socket_id, channel_name } to our auth endpoint.
//   3. We verify the user, decide if they're allowed on the channel,
//      and return Pusher's signed auth payload.
//
// `userInfo` is only used for presence channels — Pusher injects it
// into the `pusher:member_added` event so other subscribers can render
// names/avatars without an extra API call.
export function authorizeSubscription({ socketId, channel, userId, userInfo }) {
  const c = getClient();
  if (isPresenceChannel(channel)) {
    return c.authorizeChannel(socketId, channel, {
      user_id: String(userId),
      user_info: userInfo ?? {},
    });
  }
  return c.authorizeChannel(socketId, channel);
}
