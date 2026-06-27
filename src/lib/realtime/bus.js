"use client";

// Socket.io-compatible facade over the realtime port. Existing sync
// hooks call `bus.on(event, fn)` / `bus.off(event, fn)` exactly like
// they did with Socket.io. The bus tracks every (channel, event,
// handler) triple and lazily subscribes/unsubscribes on the underlying
// adapter.
//
// What the bus hides:
//   - The notion that an event lives on a specific channel. Hooks just
//     bind to event names; the bus dispatches based on the channels
//     it's already subscribed to.
//   - The presence-channel ceremony.
//   - Subscription lifecycle and cleanup.
//
// What the bus DOES NOT hide:
//   - "Which chats am I a member of?" → that's the caller's call.
//     `bus.joinChat(chatId)` / `bus.leaveChat(chatId)` mirror the
//     Socket.io `chat:join` / `chat:leave` semantics.

import {
  bindConnectionState,
  channelChannel,
  chatChannel,
  presenceChannel,
  subscribe,
  subscribePresence,
  userChannel,
} from "./client.js";

export function createBus(handle, { selfUserId }) {
  // Map<event, Set<handler>>. Source of truth for "which handlers want
  // this event". When a new channel joins, we replay every handler.
  const listenersByEvent = new Map();

  // Map<channel, channelState>
  // channelState = {
  //   count: number,                  // refcount of joinChannel callers
  //   handlers: Map<event, Map<handler, unsub>>,
  // }
  // Per-(event, handler) unsubscribe so off() can remove exactly one
  // handler without disturbing the others.
  const channelState = new Map();

  function ensureChannelSubscribed(channel) {
    if (channelState.has(channel)) return channelState.get(channel);
    const state = { count: 0, handlers: new Map() };
    channelState.set(channel, state);
    // Replay every existing event listener onto the newly-subscribed channel.
    for (const [event, handlers] of listenersByEvent) {
      const perEvent = new Map();
      state.handlers.set(event, perEvent);
      for (const handler of handlers) {
        const unsub = subscribe(handle, channel, event, handler);
        perEvent.set(handler, unsub);
      }
    }
    return state;
  }

  function joinChannel(channel) {
    const state = ensureChannelSubscribed(channel);
    state.count += 1;
  }

  function leaveChannel(channel) {
    const state = channelState.get(channel);
    if (!state) return;
    state.count -= 1;
    if (state.count > 0) return;
    for (const perEvent of state.handlers.values()) {
      for (const unsub of perEvent.values()) unsub();
    }
    channelState.delete(channel);
  }

  // Self user channel is always active for the session.
  if (selfUserId) joinChannel(userChannel(selfUserId));

  return {
    on(event, handler) {
      const set = listenersByEvent.get(event) ?? new Set();
      set.add(handler);
      listenersByEvent.set(event, set);
      // Attach on every channel we're already subscribed to.
      for (const [channel, state] of channelState) {
        const perEvent = state.handlers.get(event) ?? new Map();
        if (!perEvent.has(handler)) {
          const unsub = subscribe(handle, channel, event, handler);
          perEvent.set(handler, unsub);
        }
        state.handlers.set(event, perEvent);
      }
    },

    off(event, handler) {
      const set = listenersByEvent.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) listenersByEvent.delete(event);
      }
      for (const state of channelState.values()) {
        const perEvent = state.handlers.get(event);
        if (!perEvent) continue;
        const unsub = perEvent.get(handler);
        if (unsub) {
          unsub();
          perEvent.delete(handler);
        }
        if (perEvent.size === 0) state.handlers.delete(event);
      }
    },

    // Compatibility shim. Some legacy code called `socket.emit(event, …)`
    // — Pusher has no client-emit. All real producers now go through API
    // routes; the shim logs in dev so we can spot any missed callers.
    emit(event) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `bus.emit(${event}) is a no-op after the Pusher migration. ` +
            "Route this through an API endpoint instead.",
        );
      }
    },

    joinChat(chatId) {
      if (!chatId) return;
      joinChannel(chatChannel(chatId));
    },

    leaveChat(chatId) {
      if (!chatId) return;
      leaveChannel(chatChannel(chatId));
    },

    // Channel broadcast room. Joined when a subscriber opens the
    // channel detail page; left on navigate so a user browsing many
    // channels doesn't accumulate idle subscriptions.
    joinChannelRoom(channelId) {
      if (!channelId) return;
      joinChannel(channelChannel(channelId));
    },

    leaveChannelRoom(channelId) {
      if (!channelId) return;
      leaveChannel(channelChannel(channelId));
    },

    bindPresence(handlers) {
      // Presence has different lifecycle semantics than per-chat — we
      // want it active for the whole session if anyone calls
      // bindPresence, and we only unsubscribe when the bus is torn down.
      joinChannel(presenceChannel());
      const unbind = subscribePresence(handle, presenceChannel(), handlers);
      return () => {
        unbind();
        leaveChannel(presenceChannel());
      };
    },

    teardown() {
      for (const state of channelState.values()) {
        for (const perEvent of state.handlers.values()) {
          for (const unsub of perEvent.values()) unsub();
        }
      }
      channelState.clear();
      listenersByEvent.clear();
    },

    bindConnectionState: (onChange) => bindConnectionState(handle, onChange),
  };
}
