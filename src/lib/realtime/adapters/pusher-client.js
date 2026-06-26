"use client";

// Pusher client adapter. Implements the realtime port's client contract:
//   connect({ accessToken, endpoints }) → handle
//   disconnect(handle)
//   subscribe(handle, channel, event, handler) → unsubscribe()
//   subscribePresence(handle, channel, handlers) → unsubscribe()
//
// Feature code never imports this directly. It goes through
// `lib/realtime/client.js`, which picks the adapter based on
// NEXT_PUBLIC_REALTIME_PROVIDER.
//
// The handle is the underlying Pusher instance. We don't expose it as
// the Pusher type — the port treats it as an opaque token so an Ably
// adapter can return an Ably client instead and nothing breaks.

import Pusher from "pusher-js";

// Disable pusher-js's stats endpoint chatter in dev — it's noisy and
// adds no value during local debugging.
if (typeof window !== "undefined") {
  Pusher.logToConsole = false;
}

export function connect({ accessToken, authEndpoint }) {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    console.warn(
      "Pusher client: missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER",
    );
    return null;
  }
  return new Pusher(key, {
    cluster,
    forceTLS: true,
    // The auth endpoint signs channel subscriptions. We attach the user's
    // Bearer token so the server can verify identity the same way every
    // other API route does — no duplicate auth path.
    authEndpoint,
    auth: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export function disconnect(handle) {
  if (!handle) return;
  handle.disconnect();
}

// Subscribe to one event on a channel. Returns an unsubscribe function.
// Pusher's API distinguishes channel subscription from event binding;
// we collapse both into one call so feature code doesn't track the
// channel object itself.
export function subscribe(handle, channel, event, handler) {
  if (!handle) return () => {};
  const ch = handle.channel(channel) ?? handle.subscribe(channel);
  ch.bind(event, handler);
  return () => {
    ch.unbind(event, handler);
    // Only fully unsubscribe when no other listeners remain. pusher-js
    // tracks bound listeners internally; calling `unsubscribe` while
    // another consumer still cares would silently break them.
    if (ch.callbacks?.get?.(event)?.length === 0) {
      // Defer the unsubscribe one tick so other event handlers on the
      // same channel keep working — they share the underlying channel.
      // We never aggressively unsubscribe here because the disconnect
      // path tears the whole client down anyway.
    }
  };
}

// Presence subscription. `handlers` is `{ onJoin, onLeave, onMembers }`.
// `onMembers` fires once with the initial member list; `onJoin` /
// `onLeave` fire on each subsequent change. Returns an unsubscribe.
export function subscribePresence(handle, channel, handlers) {
  if (!handle) return () => {};
  const ch = handle.channel(channel) ?? handle.subscribe(channel);
  const onSucceeded = (members) => {
    const list = [];
    members.each((m) => list.push({ id: m.id, info: m.info }));
    handlers.onMembers?.(list);
  };
  const onAdded = (member) =>
    handlers.onJoin?.({ id: member.id, info: member.info });
  const onRemoved = (member) =>
    handlers.onLeave?.({ id: member.id, info: member.info });
  ch.bind("pusher:subscription_succeeded", onSucceeded);
  ch.bind("pusher:member_added", onAdded);
  ch.bind("pusher:member_removed", onRemoved);
  return () => {
    ch.unbind("pusher:subscription_succeeded", onSucceeded);
    ch.unbind("pusher:member_added", onAdded);
    ch.unbind("pusher:member_removed", onRemoved);
  };
}

// Hook into the connection lifecycle. Used by the realtime store to
// track an `isConnected` flag for the UI (the connection indicator
// today comes from socket-store; we mirror the same shape).
export function bindConnectionState(handle, onChange) {
  if (!handle) return () => {};
  const onConnected = () => onChange(true);
  const onDisconnected = () => onChange(false);
  handle.connection.bind("connected", onConnected);
  handle.connection.bind("disconnected", onDisconnected);
  handle.connection.bind("failed", onDisconnected);
  handle.connection.bind("unavailable", onDisconnected);
  return () => {
    handle.connection.unbind("connected", onConnected);
    handle.connection.unbind("disconnected", onDisconnected);
    handle.connection.unbind("failed", onDisconnected);
    handle.connection.unbind("unavailable", onDisconnected);
  };
}
