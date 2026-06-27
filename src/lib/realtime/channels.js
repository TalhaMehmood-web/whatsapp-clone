// Channel naming policy. The realtime adapter (Pusher today, possibly
// Ably or Supabase Realtime tomorrow) decides what *prefix* a channel
// needs — Pusher requires `private-` for authorised channels and
// `presence-` for presence channels; Ably uses different conventions.
//
// Feature code never builds raw channel strings. It calls
// `chatChannel(id)` / `userChannel(id)` / `presenceChannel()` and the
// adapter handles the rest. This keeps the swap-cost low.

const CHAT_PREFIX = "private-chat-";
const USER_PREFIX = "private-user-";
const CHANNEL_PREFIX = "private-channel-";
const PRESENCE_NAME = "presence-online";

// Per-chat fan-out: message:new, message:edited, typing, etc.
// Subscribed by every chat member's client.
export function chatChannel(chatId) {
  if (!chatId) throw new Error("chatChannel: chatId is required");
  return `${CHAT_PREFIX}${chatId}`;
}

// Per-user direct events: friend requests, notifications, call signals.
// Subscribed only by that user's tabs/devices.
export function userChannel(userId) {
  if (!userId) throw new Error("userChannel: userId is required");
  return `${USER_PREFIX}${userId}`;
}

// Per-channel broadcast namespace. Used for CHANNEL_POST_* events.
// Subscribed by every Channel subscriber's client when the channel
// page is open — clients leave the room when they navigate away to
// keep Pusher's concurrent-connection budget under control.
export function channelChannel(channelId) {
  if (!channelId) throw new Error("channelChannel: channelId is required");
  return `${CHANNEL_PREFIX}${channelId}`;
}

// Single global presence channel. Joining = "I'm online"; leaving =
// "I'm offline". Replaces the manual USER_ONLINE / USER_OFFLINE emits.
export function presenceChannel() {
  return PRESENCE_NAME;
}

// Channel-pattern matchers used by the auth route to decide what a user
// is allowed to subscribe to. Adapter-agnostic — they just operate on
// the channel string the client requested.
export function isChatChannel(name) {
  return typeof name === "string" && name.startsWith(CHAT_PREFIX);
}

export function isUserChannel(name) {
  return typeof name === "string" && name.startsWith(USER_PREFIX);
}

export function isChannelChannel(name) {
  return typeof name === "string" && name.startsWith(CHANNEL_PREFIX);
}

export function isPresenceChannel(name) {
  return name === PRESENCE_NAME;
}

export function chatIdFromChannel(name) {
  return isChatChannel(name) ? name.slice(CHAT_PREFIX.length) : null;
}

export function userIdFromChannel(name) {
  return isUserChannel(name) ? name.slice(USER_PREFIX.length) : null;
}

export function channelIdFromChannel(name) {
  return isChannelChannel(name) ? name.slice(CHANNEL_PREFIX.length) : null;
}
