// Single source of truth for all TanStack Query cache keys.
// Always use dot notation — `queryKeys.messages.list(chatId)`.
// Never write a raw array in a query hook.

export const queryKeys = {
  auth: {
    me: ["auth", "me"],
    session: ["auth", "session"],
  },
  chats: {
    all: ["chats"],
    list: (filters) => ["chats", "list", filters],
    archived: ["chats", "archived"],
    locked: ["chats", "locked"],
    detail: (id) => ["chats", "detail", id],
    members: (id) => ["chats", "members", id],
    media: (id) => ["chats", "media", id],
  },
  messages: {
    all: ["messages"],
    list: (chatId) => ["messages", "list", chatId],
    starred: ["messages", "starred"],
  },
  users: {
    all: ["users"],
    detail: (id) => ["users", "detail", id],
    search: (q) => ["users", "search", q],
    contacts: ["users", "contacts"],
    privacy: ["users", "me", "privacy"],
    eligibleContacts: ["users", "me", "contacts", "eligible"],
    chatPrefs: ["users", "me", "chat-prefs"],
    notifPrefs: ["users", "me", "notif-prefs"],
    blocked: ["users", "me", "blocked"],
    byHandle: (handle) => ["users", "by-handle", handle],
  },
  status: {
    all: ["status"],
    list: ["status", "list"],
    mine: ["status", "mine"],
    contacts: ["status", "contacts"],
    author: (id) => ["status", "author", id],
    viewers: (id) => ["status", "viewers", id],
  },
  communities: {
    all: ["communities"],
    list: ["communities", "list"],
    detail: (id) => ["communities", "detail", id],
    byHandle: (handle) => ["communities", "by-handle", handle],
  },
  groups: {
    byInviteHandle: (handle) => ["groups", "by-invite-handle", handle],
  },
  channels: {
    all: ["channels"],
    list: ["channels", "list"],
    detail: (id) => ["channels", "detail", id],
    byHandle: (handle) => ["channels", "by-handle", handle],
    explore: (q) => ["channels", "explore", q ?? ""],
    posts: (id) => ["channels", "posts", id],
    replies: (postId) => ["channels", "replies", postId],
    admins: (id) => ["channels", "admins", id],
    subscribers: (id) => ["channels", "subscribers", id],
  },
  labels: {
    list: ["labels"],
  },
  calls: {
    log: ["calls", "log"],
    active: ["calls", "active"],
  },
  search: {
    global: (q) => ["search", "global", q],
    chat: (chatId, q) => ["search", "chat", chatId, q],
    messages: (q) => ["search", "messages", q],
  },
  friendRequests: {
    incoming: ["friend-requests", "incoming"],
    outgoing: ["friend-requests", "outgoing"],
    friends: ["friend-requests", "friends"],
  },
  notifications: {
    list: ["notifications", "list"],
  },
};
