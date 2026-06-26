// Single source of truth for all API URLs.
// Route handlers and TanStack hooks both import from here.
// Never write a URL string anywhere else.

const BASE = "/api";

export const endpoints = {
  auth: {
    login: `${BASE}/auth/login`,
    register: `${BASE}/auth/register`,
    logout: `${BASE}/auth/logout`,
    refresh: `${BASE}/auth/refresh`,
    me: `${BASE}/users/me`,
  },
  realtime: {
    // Provider-agnostic subscription authoriser. Same URL whether the
    // adapter under the hood is Pusher, Ably, or anything else later.
    auth: `${BASE}/realtime/auth`,
  },
  chats: {
    list: `${BASE}/chats`,
    archived: `${BASE}/chats/archived`,
    detail: (id) => `${BASE}/chats/${id}`,
    messages: (id) => `${BASE}/chats/${id}/messages`,
    members: (id) => `${BASE}/chats/${id}/members`,
    pin: (id) => `${BASE}/chats/${id}/pin`,
    mute: (id) => `${BASE}/chats/${id}/mute`,
    archive: (id) => `${BASE}/chats/${id}/archive`,
    favourite: (id) => `${BASE}/chats/${id}/favourite`,
    labels: (id) => `${BASE}/chats/${id}/labels`,
    media: (id) => `${BASE}/chats/${id}/media`,
    read: (id) => `${BASE}/chats/${id}/read`,
    unread: (id) => `${BASE}/chats/${id}/unread`,
    clear: (id) => `${BASE}/chats/${id}/clear`,
    lock: (id) => `${BASE}/chats/${id}/lock`,
    typing: (id) => `${BASE}/chats/${id}/typing`,
    locked: `${BASE}/chats/locked`,
    disappearing: (id) => `${BASE}/chats/${id}/disappearing`,
  },
  messages: {
    detail: (id) => `${BASE}/messages/${id}`,
    react: (id) => `${BASE}/messages/${id}/react`,
    star: (id) => `${BASE}/messages/${id}/star`,
    pin: (id) => `${BASE}/messages/${id}/pin`,
    report: (id) => `${BASE}/messages/${id}/report`,
    forward: (id) => `${BASE}/messages/${id}/forward`,
    upload: `${BASE}/messages/upload`,
    starred: `${BASE}/messages/starred`,
  },
  users: {
    list: `${BASE}/users`,
    me: `${BASE}/users/me`,
    avatar: `${BASE}/users/me/avatar`,
    about: `${BASE}/users/me/about`,
    privacy: `${BASE}/users/me/privacy`,
    privacyExceptions: `${BASE}/users/me/privacy/exceptions`,
    eligibleContacts: `${BASE}/users/me/contacts/eligible`,
    chatPrefs: `${BASE}/users/me/chat-prefs`,
    wallpaper: `${BASE}/users/me/wallpaper`,
    notifPrefs: `${BASE}/users/me/notifications`,
    push: `${BASE}/users/me/push`,
    lockedChatsSecret: `${BASE}/users/me/locked-chats-secret`,
    blocked: `${BASE}/users/me/blocked`,
    block: (id) => `${BASE}/users/${id}/block`,
    byHandle: (handle) => `${BASE}/u/${handle}`,
  },
  status: {
    list: `${BASE}/status`,
    detail: (id) => `${BASE}/status/${id}`,
    view: (id) => `${BASE}/status/${id}/view`,
    viewers: (id) => `${BASE}/status/${id}/viewers`,
    author: (id) => `${BASE}/status/author/${id}`,
  },
  communities: {
    list: `${BASE}/communities`,
    detail: (id) => `${BASE}/communities/${id}`,
  },
  channels: {
    list: `${BASE}/channels`,
    detail: (id) => `${BASE}/channels/${id}`,
  },
  labels: {
    list: `${BASE}/labels`,
  },
  calls: {
    list: `${BASE}/calls`,
    detail: (id) => `${BASE}/calls/${id}`,
    join: `${BASE}/calls/join`,
    signal: `${BASE}/calls/signal`,
  },
  search: {
    global: `${BASE}/search`,
    chat: (id) => `${BASE}/chats/${id}/search`,
  },
  friendRequests: {
    list: `${BASE}/friend-requests`,
    send: `${BASE}/friend-requests`,
    item: (id) => `${BASE}/friend-requests/${id}`,
    friends: `${BASE}/friend-requests/friends`,
  },
  notifications: {
    list: `${BASE}/notifications`,
    markAllRead: `${BASE}/notifications`,
    markRead: (id) => `${BASE}/notifications/${id}/read`,
  },
};
