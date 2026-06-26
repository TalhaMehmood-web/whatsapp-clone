// Backwards-compatibility shim. Historically this file held the
// Socket.io fan-out helpers used by route handlers + lib helpers. The
// implementation moved to `lib/realtime/server.js` (provider-agnostic
// port) so we can swap Socket.io for Pusher / Ably / Supabase Realtime
// without touching every call site.
//
// New code should import from `@/lib/realtime/server` directly:
//
//   import { triggerToChat, triggerToUser } from "@/lib/realtime/server";
//
// The `emitToChat` / `emitToUser` aliases below stay for now so the
// existing seven consumers (`messages.js`, `groups.js`, `friend-requests.js`,
// `calls.js`, `notifications.js`, `reactions.js`, `receipts.js`) keep
// compiling unchanged. They'll be migrated in a follow-up sweep, after
// which this file gets deleted.

import {
  triggerToChat,
  triggerToUser,
} from "./realtime/server.js";

// Deprecated. Use `triggerToChat` from `lib/realtime/server` instead.
export function emitToChat(chatId, event, payload) {
  // Fire-and-forget — preserves the void return shape of the old API.
  void triggerToChat(chatId, event, payload);
}

// Deprecated. Use `triggerToUser` from `lib/realtime/server` instead.
export function emitToUser(userId, event, payload) {
  void triggerToUser(userId, event, payload);
}

// The Socket.io custom server set/got the `io` instance through these.
// Pusher is HTTPS-only so there's no live handle to share — both
// functions are no-ops, kept only to avoid breaking the import in
// `server.js` while we phase that file out (P9).
export function getIO() {
  return null;
}
export function setIO() {
  // No-op.
}
