// Single source of truth for "is this user online?" derived presence.
//
// The DB User.isOnline column is set at login and cleared at logout,
// which means anyone who closed their tab without logging out stays
// stuck "online" forever. Public-profile, chat-header, and chat-list
// all read presence — they all must use this helper instead of the raw
// column so a closed tab decays to offline within PRESENCE_FRESH_MS.
//
// The client pings /api/users/me/heartbeat every 60s while the tab is
// visible (see use-heartbeat.js); 2 minutes leaves a generous buffer
// for a missed ping or brief tab-switch.

export const PRESENCE_FRESH_MS = 2 * 60 * 1000;

// Returns true iff `lastSeen` is within the freshness window.
export function isFreshlyOnline(lastSeen) {
  if (!lastSeen) return false;
  const t = lastSeen instanceof Date ? lastSeen.getTime() : new Date(lastSeen).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < PRESENCE_FRESH_MS;
}

// In-place patch helper. Mutates the passed user-shaped object so its
// `isOnline` reflects derived presence, not the stale DB column.
// Returns the same reference for caller chainability.
export function applyDerivedPresence(user) {
  if (!user) return user;
  user.isOnline = isFreshlyOnline(user.lastSeen);
  return user;
}
