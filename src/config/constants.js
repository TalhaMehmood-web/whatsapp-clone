// Single source of truth for every hardcoded string used in the UI.
// Use enum-style frozen objects: `CHAT_TAB.UNREAD`, not `"unread"`.
//
// Two rules:
//   1. If a string appears in more than one file (an id, a key, a query param,
//      a route path), it lives here.
//   2. User-facing copy that may need to be translated lives here too, even if
//      it's only used once. Group by feature.
//
// Prisma enum values (MessageType, MemberRole, …) belong in
// `src/models/enums.js`. Don't duplicate them here.

// ─── Chat list ─────────────────────────────────────────────────────────────

export const CHAT_TAB = Object.freeze({
  ALL: "all",
  UNREAD: "unread",
  FAVOURITES: "favourites",
  GROUPS: "groups",
  ARCHIVED: "archived",
  LOCKED: "locked",
});

export const CHAT_TAB_LABEL = Object.freeze({
  [CHAT_TAB.ALL]: "All",
  [CHAT_TAB.UNREAD]: "Unread",
  [CHAT_TAB.FAVOURITES]: "Favourites",
  [CHAT_TAB.GROUPS]: "Groups",
  [CHAT_TAB.ARCHIVED]: "Archived",
});

export const CHAT_MENU_ACTION = Object.freeze({
  NEW_GROUP: "new-group",
  NEW_COMMUNITY: "new-community",
  STARRED: "starred",
  LOGOUT: "logout",
});

export const CHAT_ITEM_ACTION = Object.freeze({
  PIN: "pin",
  FAVOURITE: "favourite",
  MUTE: "mute",
  ARCHIVE: "archive",
});

// ─── App routes ────────────────────────────────────────────────────────────

export const ROUTES = Object.freeze({
  LOGIN: "/login",
  REGISTER: "/register",
  CHAT_INDEX: "/chat",
  CHAT_DETAIL: (id) => `/chat/${id}`,
  STATUS: "/status",
  CHANNELS: "/channels",
  COMMUNITIES: "/communities",
  CALLS: "/calls",
  ARCHIVED: "/archived",
  STARRED: "/starred",
  LOCKED_CHATS: "/locked",
  SETTINGS: "/settings",
  SETTINGS_PROFILE: "/settings/profile",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_PRIVACY: "/settings/privacy",
  SETTINGS_CHATS: "/settings/chats",
  SETTINGS_NOTIFICATIONS: "/settings/notifications",
  META_AI: "/meta-ai",
  SEARCH_PAGE: "/search",
  REQUESTS: "/requests",
  PROFILE: (handle) => `/u/${handle}`,
});

// ─── Nav rail item identifiers ─────────────────────────────────────────────

export const NAV_ITEM = Object.freeze({
  CHATS: "chats",
  STATUS: "status",
  CHANNELS: "channels",
  COMMUNITIES: "communities",
  META_AI: "meta-ai",
  ARCHIVED: "archived",
  PROFILE: "profile",
});

// ─── Theme ─────────────────────────────────────────────────────────────────

export const THEME = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
});

// ─── Sockets ───────────────────────────────────────────────────────────────

export const SOCKET_EVENT = Object.freeze({
  CHAT_JOIN: "chat:join",
  CHAT_LEAVE: "chat:leave",
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  TYPING_UPDATE: "typing:update",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  CALL_DECLINE: "call:decline",
  CALL_END: "call:end",
  CALL_UPDATE: "call:update",
  CALL_LOG_UPDATE: "call:log:update",
  CALL_SIGNAL: "call:signal",
  MESSAGE_REACTION: "message:reaction",
  MESSAGE_EDITED: "message:edited",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_PURGED: "message:purged",
  MESSAGE_PINNED: "message:pinned",
  FRIEND_REQUEST: "friend:request",
  FRIEND_REQUEST_UPDATE: "friend:request:update",
  FRIEND_REQUEST_CANCEL: "friend:request:cancel",
  NOTIFICATION_NEW: "notification:new",
  GROUP_ADDED: "group:added",
  GROUP_REMOVED: "group:removed",
  GROUP_UPDATE: "group:update",
});

// ─── Local storage keys ────────────────────────────────────────────────────

export const STORAGE_KEY = Object.freeze({
  ACCESS_TOKEN: "access_token",
  THEME: "theme",
});

// ─── Cookies ───────────────────────────────────────────────────────────────

export const COOKIE = Object.freeze({
  REFRESH_TOKEN: "refresh_token",
});

// ─── Copy strings (user-facing) ────────────────────────────────────────────

export const COPY = Object.freeze({
  APP_NAME: "WhatsApp",
  SEARCH_PLACEHOLDER: "Search or start a new chat",
  TYPE_A_MESSAGE: "Type a message",
  LOG_OUT: "Log out",
  STARRED_MESSAGES: "Starred messages",
  NEW_GROUP: "New group",
  NEW_COMMUNITY: "New community",
  NEW_CHAT: "New chat",
  PIN_CHAT: "Pin chat",
  UNPIN_CHAT: "Unpin chat",
  ARCHIVE: "Archive",
  UNARCHIVE: "Unarchive",
  MUTE_8H: "Mute for 8 hours",
  UNMUTE: "Unmute",
  ADD_TO_FAVOURITES: "Add to favourites",
  REMOVE_FROM_FAVOURITES: "Remove from favourites",
  EMPTY_DOWNLOAD_TITLE: "Download WhatsApp for Windows",
  EMPTY_DOWNLOAD_BODY:
    "Get extra features like voice and video calling, screen sharing and more.",
  EMPTY_DOWNLOAD_CTA: "Download",
  EMPTY_PILL_DOC: "Send document",
  EMPTY_PILL_CONTACT: "Add contact",
  EMPTY_PILL_AI: "Ask Meta AI",
  ENCRYPTED_FOOTER:
    "Your personal messages are end-to-end encrypted",
  // Nav rail tooltips
  NAV_CHATS: "Chats",
  NAV_STATUS: "Status",
  NAV_CHANNELS: "Channels",
  NAV_COMMUNITIES: "Communities",
  NAV_CALLS: "Calls",
  NAV_META_AI: "Meta AI",
  NAV_ARCHIVED: "Archived",
  NAV_PROFILE: "Profile",
  // New chat modal
  NEW_CHAT_TITLE: "New chat",
  NEW_CHAT_DESCRIPTION:
    "Search for a contact by name, email or phone to start a conversation.",
  NEW_CHAT_SEARCH_PLACEHOLDER: "Search name, email or phone",
  NEW_CHAT_EMPTY_HINT: "Start typing to find contacts.",
  NEW_CHAT_NO_RESULTS: "No users match your search.",
  // New group modal
  NEW_GROUP_TITLE: "New group",
  NEW_GROUP_DESCRIPTION:
    "Pick a name and at least one member. You can change these later.",
  NEW_GROUP_NAME_LABEL: "Group name",
  NEW_GROUP_NAME_PLACEHOLDER: "e.g. Weekend Trip",
  NEW_GROUP_MEMBERS_LABEL: "Members",
  NEW_GROUP_MEMBERS_HINT: "Tap users to add or remove from the group.",
  NEW_GROUP_CREATE: "Create group",
  // Group info sheet
  GROUP_INFO_TITLE: "Group info",
  GROUP_INFO_MEMBERS: "Members",
  GROUP_INFO_ADD_MEMBERS: "Add members",
  GROUP_INFO_LEAVE: "Leave group",
  GROUP_INFO_REMOVE: "Remove from group",
  GROUP_INFO_MAKE_ADMIN: "Make admin",
  GROUP_INFO_REVOKE_ADMIN: "Dismiss as admin",
  // Labels
  LABELS_TITLE: "Labels",
  LABELS_DESCRIPTION:
    "Tag chats with colored labels and filter them from the chat list.",
  LABELS_CREATE_PLACEHOLDER: "New label name",
  LABELS_CREATE: "Create",
  LABELS_NONE: "No labels yet.",
  LABELS_ASSIGN_TITLE: "Label this chat",
  LABEL_CHAT: "Label chat",
  // Chat row context menu (matches WhatsApp Web order)
  CHAT_ITEM_LOCK: "Lock chat",
  CHAT_ITEM_MUTE_NOTIFICATIONS: "Mute notifications",
  CHAT_ITEM_MARK_UNREAD: "Mark as unread",
  CHAT_ITEM_ADD_TO_LIST: "Add to list",
  CHAT_ITEM_BLOCK: "Block",
  CHAT_ITEM_CLEAR: "Clear chat",
  CHAT_ITEM_DELETE: "Delete chat",
  CHAT_ITEM_CLEAR_CONFIRM_TITLE: "Clear this chat?",
  CHAT_ITEM_CLEAR_CONFIRM_BODY:
    "All messages in this chat will be removed. Future messages will still appear here.",
  CHAT_ITEM_DELETE_CONFIRM_TITLE: "Delete this chat?",
  CHAT_ITEM_DELETE_CONFIRM_BODY:
    "The chat will be removed from your chat list. For groups this is the same as leaving.",
  CHAT_ITEM_LOCK_COMING: "Locked chats are coming soon.",
  // Locked chats
  LOCK_CHAT: "Lock chat",
  UNLOCK_CHAT: "Unlock chat",
  LOCKED_CHATS_TITLE: "Locked chats",
  LOCKED_CHATS_SETUP_TITLE: "Set a secret code",
  LOCKED_CHATS_SETUP_BODY:
    "Pick a code that you'll use to open every locked chat on this account.",
  LOCKED_CHATS_SETUP_PLACEHOLDER: "Secret code",
  LOCKED_CHATS_SETUP_CONFIRM: "Confirm secret code",
  LOCKED_CHATS_SETUP_MISMATCH: "The codes don't match.",
  LOCKED_CHATS_SETUP_TOO_SHORT: "Use at least 4 characters.",
  LOCKED_CHATS_SETUP_CTA: "Save code",
  LOCKED_CHATS_UNLOCK_TITLE: "Enter your secret code",
  LOCKED_CHATS_UNLOCK_BODY:
    "Locked chats stay hidden from the main list. Enter your code to see them.",
  LOCKED_CHATS_UNLOCK_CTA: "Unlock",
  LOCKED_CHATS_UNLOCK_WRONG: "Wrong code. Try again.",
  LOCKED_CHATS_EMPTY: "No locked chats yet.",
  LOCKED_CHATS_BANNER: "Locked chats",
  LOCKED_CHATS_BANNER_HINT: "Tap to unlock",
  LOCKED_CHAT_TOAST: "Chat locked",
  UNLOCKED_CHAT_TOAST: "Chat unlocked",
  // Chat header overflow (WA Web parity)
  CHAT_HDR_CONTACT_INFO: "Contact info",
  CHAT_HDR_GROUP_INFO: "Group info",
  CHAT_HDR_SEARCH: "Search",
  CHAT_HDR_SELECT_MESSAGES: "Select messages",
  CHAT_HDR_DISAPPEARING: "Disappearing messages",
  CHAT_HDR_CLOSE: "Close chat",
  CHAT_HDR_SEND_CALL_LINK: "Send call link",
  CHAT_HDR_CALL_LINK_COPIED: "Call link copied",
  CHAT_HDR_CALL_LINK_SENT: "Call link sent in chat",
  // Disappearing dialog
  DISAPPEARING_DIALOG_TITLE: "Disappearing messages",
  DISAPPEARING_DIALOG_BODY:
    "Pick how long new messages should stay in this chat before they disappear.",
  DISAPPEARING_OFF: "Off",
  DISAPPEARING_24H: "24 hours",
  DISAPPEARING_7D: "7 days",
  DISAPPEARING_90D: "90 days",
  DISAPPEARING_ACTIVE: "Disappearing messages on",
  // Selection bar
  SELECT_DELETE: "Delete",
  SELECT_FORWARD: "Forward",
  SELECT_STAR: "Star",
  SELECT_CANCEL: "Cancel",
  SELECT_COUNT: (n) => `${n} selected`,
  CONFIRM_CANCEL: "Cancel",
  // Status / Stories
  STATUS_TITLE: "Status",
  STATUS_MY: "My status",
  STATUS_MY_HINT: "Click to add status update",
  STATUS_RECENT: "Recent",
  STATUS_VIEWED: "Viewed",
  STATUS_TEXT_BUTTON: "Text status",
  STATUS_MEDIA_BUTTON: "Photo and video",
  STATUS_REPLY_PLACEHOLDER: "Type a reply…",
  STATUS_COMPOSE_PLACEHOLDER: "What's happening?",
  STATUS_SEND: "Send",
  // Communities
  COMMUNITIES_TITLE: "Communities",
  COMMUNITIES_NEW: "New community",
  COMMUNITIES_VIEW_ALL: "View all",
  COMMUNITIES_EMPTY: "You haven't joined any communities yet.",
  COMMUNITIES_NEW_TITLE: "New community",
  COMMUNITIES_NEW_DESC:
    "Bring your groups together. You can add member groups after the community exists.",
  COMMUNITIES_NAME_LABEL: "Community name",
  COMMUNITIES_NAME_PLACEHOLDER: "e.g. Class of 2024",
  COMMUNITIES_DESC_LABEL: "Description",
  COMMUNITIES_DESC_PLACEHOLDER: "What's this community about?",
  COMMUNITIES_CREATE: "Create community",
  COMMUNITIES_FOOTER:
    "Your personal messages in communities are end-to-end encrypted",
  COMMUNITIES_MEDIA_TITLE: "Media",
  COMMUNITIES_MEDIA_SUBTITLE: "Media from all chats",
  COMMUNITIES_TAB_MEDIA: "Media",
  COMMUNITIES_TAB_DOCS: "Docs",
  COMMUNITIES_TAB_LINKS: "Links",
  // Channels
  CHANNELS_TITLE: "Channels",
  CHANNELS_NEW: "New channel",
  CHANNELS_MY: "My channels",
  CHANNELS_DISCOVER: "Find channels to follow",
  CHANNELS_FOLLOW: "Follow",
  CHANNELS_FOLLOWING: "Following",
  CHANNELS_EMPTY: "No channels yet.",
  CHANNELS_NEW_TITLE: "New channel",
  CHANNELS_NEW_DESC:
    "Channels broadcast updates one-to-many. Followers receive your posts but can't reply.",
  CHANNELS_NAME_LABEL: "Channel name",
  CHANNELS_NAME_PLACEHOLDER: "e.g. Daily Football News",
  CHANNELS_HANDLE_LABEL: "@handle",
  CHANNELS_HANDLE_PLACEHOLDER: "footballdaily",
  CHANNELS_DESC_LABEL: "Description",
  CHANNELS_DESC_PLACEHOLDER: "What will you post about?",
  CHANNELS_CREATE: "Create channel",
  // Settings
  SETTINGS_TITLE: "Settings",
  SETTINGS_SEARCH: "Search settings",
  SETTINGS_PROFILE: "Profile",
  SETTINGS_PROFILE_DESC: "Name, profile picture",
  SETTINGS_ACCOUNT: "Account",
  SETTINGS_ACCOUNT_DESC: "Security notifications, account info",
  SETTINGS_PRIVACY: "Privacy",
  SETTINGS_PRIVACY_DESC: "Blocked contacts, disappearing messages",
  SETTINGS_CHATS: "Chats",
  SETTINGS_CHATS_DESC: "Theme, wallpaper, chat settings",
  SETTINGS_NOTIFICATIONS: "Notifications",
  SETTINGS_NOTIFICATIONS_DESC: "Messages, groups, sounds",
  SETTINGS_SHORTCUTS: "Keyboard shortcuts",
  SETTINGS_SHORTCUTS_DESC: "Quick actions",
  SETTINGS_HELP: "Help and feedback",
  SETTINGS_HELP_DESC: "Help centre, contact us, privacy policy",
  // Profile editor
  PROFILE_EDIT_TITLE: "Edit profile",
  PROFILE_EDIT_BUTTON: "Edit",
  PROFILE_NAME_LABEL: "Name",
  PROFILE_ABOUT_LABEL: "About",
  PROFILE_PHONE_LABEL: "Phone",
  PROFILE_EMAIL_LABEL: "Email",
  PROFILE_HANDLE_LABEL: "Username",
  PROFILE_HANDLE_COPIED: "Username copied",
  PROFILE_PHONE_COPIED: "Phone copied",
  PROFILE_ABOUT_PRESETS_TITLE: "Currently set to",
  PROFILE_ABOUT_PRESETS_HINT: "Or pick a quick status",
  PROFILE_ABOUT_PRESETS: [
    "Available",
    "Busy",
    "At work",
    "At school",
    "Battery about to die",
    "Can't talk, WhatsApp only",
    "In a meeting",
    "At the gym",
    "Sleeping",
    "Urgent calls only",
  ],
  // Account
  ACCOUNT_SECURITY: "Security notifications",
  ACCOUNT_SECURITY_DESC:
    "Get notified when your security code changes for a contact's phone. To learn more, see WhatsApp's Help Center.",
  ACCOUNT_REQUEST_INFO: "Request account info",
  ACCOUNT_REQUEST_INFO_DESC:
    "Request a report of your account information and settings, which you can access or port to another app.",
  ACCOUNT_REQUEST_INFO_COMING: "Account-info export is coming soon.",
  ACCOUNT_DELETE: "Delete my account",
  ACCOUNT_DELETE_DESC:
    "Deleting your account will permanently erase your message history, every chat, and your profile.",
  ACCOUNT_DELETE_TITLE: "Delete your account?",
  ACCOUNT_DELETE_BODY:
    "This permanently removes your account, every chat you started, your status updates, and your profile. This action cannot be undone.",
  ACCOUNT_DELETE_CONFIRM_LABEL: (handle) => `Type @${handle} to confirm`,
  ACCOUNT_DELETE_CONFIRM_PLACEHOLDER: "@your_handle",
  ACCOUNT_DELETE_BUTTON: "Delete account",
  // Privacy
  PRIVACY_PERSONAL: "Who can see my personal info",
  PRIVACY_LAST_SEEN: "Last seen and online",
  PRIVACY_PROFILE_PHOTO: "Profile picture",
  PRIVACY_ABOUT: "About",
  PRIVACY_STATUS: "Status",
  PRIVACY_READ_RECEIPTS: "Read receipts",
  PRIVACY_READ_RECEIPTS_HINT:
    "If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.",
  PRIVACY_DISAPPEARING_TITLE: "Disappearing messages",
  PRIVACY_DEFAULT_TIMER: "Default message timer",
  PRIVACY_DEFAULT_TIMER_HINT:
    "Start new chats with disappearing messages set to your preferred duration. This only affects chats you start — existing chats stay as they are.",
  PRIVACY_GROUPS: "Groups",
  PRIVACY_EXCEPT_LAST_SEEN: "Hide last seen from…",
  PRIVACY_EXCEPT_PROFILE_PHOTO: "Hide profile photo from…",
  PRIVACY_EXCEPT_ABOUT: "Hide about from…",
  PRIVACY_EXCEPT_STATUS: "Hide status from…",
  PRIVACY_EXCEPT_GROUPS: "Hide groups from…",
  PRIVACY_EXCEPT_SEARCH: "Search name or number",
  PRIVACY_EXCEPT_CONTACTS: "Contacts",
  PRIVACY_EXCEPT_NONE: "No contacts to choose from. Add a friend first.",
  PRIVACY_EXCEPT_DONE: "Save",
  PRIVACY_EXCEPT_COUNT: (n) =>
    `${n} ${n === 1 ? "contact" : "contacts"} excluded`,
  PRIVACY_EXCEPT_LOADING: "Loading contacts…",
  PRIVACY_APP_LOCK: "App lock",
  PRIVACY_APP_LOCK_DESC: "Require password to unlock WhatsApp",
  PRIVACY_APP_LOCK_COMING:
    "Coming soon — we'll let you lock WhatsApp with your passkey or device password.",
  PRIVACY_ADVANCED: "Advanced",
  PRIVACY_BLOCK_UNKNOWN: "Block unknown account messages",
  PRIVACY_BLOCK_UNKNOWN_DESC:
    "To protect your account and improve performance, WhatsApp will block messages from unknown accounts if they exceed a certain volume.",
  PRIVACY_LINK_PREVIEWS: "Turn off link previews",
  PRIVACY_LINK_PREVIEWS_DESC:
    "To help protect your IP address from being inferred by third-party websites, previews for the links you share in chats will no longer be generated.",
  // Chats section
  CHAT_PREFS_DISPLAY: "Display",
  CHAT_PREFS_THEME: "Theme",
  CHAT_PREFS_WALLPAPER: "Wallpaper",
  CHAT_PREFS_SETTINGS: "Chat settings",
  CHAT_PREFS_MEDIA_UPLOAD: "Media upload quality",
  CHAT_PREFS_MEDIA_AUTODL: "Media auto-download",
  CHAT_PREFS_SPELL_CHECK: "Spell check",
  CHAT_PREFS_SPELL_CHECK_DESC: "Check spelling while typing",
  CHAT_PREFS_REPLACE_EMOJI: "Replace text with emoji",
  CHAT_PREFS_REPLACE_EMOJI_DESC: "Emoji will replace specific text as you type",
  CHAT_PREFS_ENTER_SEND: "Enter is send",
  CHAT_PREFS_ENTER_SEND_DESC: "Enter key will send your message",
  CHAT_PREFS_WALLPAPER_DESC:
    "Choose a doodle wallpaper for the message background.",
  CHAT_PREFS_MEDIA_UPLOAD_DESC:
    "HD keeps the highest possible quality. Standard saves data.",
  CHAT_PREFS_MEDIA_AUTODL_DESC:
    "Pick which media types should download automatically on this device.",
  CHAT_PREFS_AUTODL_PHOTOS: "Photos",
  CHAT_PREFS_AUTODL_VIDEOS: "Videos",
  CHAT_PREFS_AUTODL_DOCS: "Documents",
  WALLPAPER_DEFAULT: "Default doodles",
  WALLPAPER_SOLID: "Solid color",
  WALLPAPER_RESET: "Reset",
  WALLPAPER_TAB_SOLID: "Solid colors",
  WALLPAPER_TAB_CUSTOM: "Upload your own",
  WALLPAPER_PICK_FILE: "Pick an image",
  WALLPAPER_REPLACE: "Replace image",
  WALLPAPER_CUSTOM_LABEL: "Custom wallpaper",
  // Notifications
  NOTIF_MESSAGES: "Messages",
  NOTIF_MESSAGES_DESC: "Get notified when someone messages you in a 1:1 chat.",
  NOTIF_GROUPS: "Groups",
  NOTIF_GROUPS_DESC: "Get notified when someone messages a group you're in.",
  NOTIF_STATUS: "Status",
  NOTIF_STATUS_DESC: "Get notified when a contact posts a new status.",
  NOTIF_PREVIEWS: "Show previews",
  NOTIF_PREVIEWS_DESC: "Preview message text inside message notifications.",
  NOTIF_SOUNDS: "Play sound for outgoing messages",
  NOTIF_REACTION_SOUNDS: "Reaction sounds",
  NOTIF_REACTION_SOUNDS_DESC: "Play a short pop when someone reacts to one of your messages.",
  NOTIF_KIND_LABEL: "Notification kinds",
  NOTIF_ON_DEVICE_LABEL: "On this device",
  NOTIF_BG_SYNC: "Background sync",
  NOTIF_BG_SYNC_DESC:
    "Get faster performance by syncing messages in the background.",
  // Keyboard shortcuts
  SHORTCUTS_TITLE: "Keyboard shortcuts",
  SHORTCUTS_OK: "OK",
  // Calls
  CALLS_TITLE: "Calls",
  CALLS_EMPTY: "No recent calls.",
  CALLS_NEW: "New call",
  CALL_INCOMING: "Incoming call",
  CALL_VOICE: "Voice call",
  CALL_VIDEO: "Video call",
  CALL_MISSED: "Missed",
  CALL_DECLINED: "Declined",
  CALL_ANSWERED: "Answered",
  CALL_ONGOING: "Ongoing",
  CALL_ANSWER: "Answer",
  CALL_DECLINE: "Decline",
  CALL_MUTE: "Mute",
  CALL_UNMUTE: "Unmute",
  CALL_END: "End",
  CALL_VIDEO_TOGGLE: "Toggle video",
  // Push notifications
  PUSH_ENABLE: "Enable notifications",
  PUSH_DISABLED: "Notifications are disabled in your browser.",
  PUSH_PERMISSION_BLOCKED:
    "Notifications are blocked. Allow them in your browser settings.",
  PUSH_PROMPT_TITLE: "Choose your notifications",
  PUSH_PROMPT_BODY:
    "Get notifications for messages, groups or your status.",
  PUSH_PROMPT_CTA: "Choose now",
  // Message actions
  MSG_REPLY: "Reply",
  MSG_REACT: "React",
  MSG_FORWARD: "Forward",
  MSG_COPY: "Copy",
  MSG_STAR: "Star",
  MSG_UNSTAR: "Unstar",
  MSG_EDIT: "Edit",
  MSG_DELETE: "Delete",
  MSG_DELETED: "This message was deleted",
  MSG_EDITED: "edited",
  MSG_FORWARDED: "Forwarded",
  MSG_PIN: "Pin",
  MSG_UNPIN: "Unpin",
  MSG_ASK_META_AI: "Ask Meta AI",
  MSG_ASK_META_AI_COMING: "Meta AI is coming soon.",
  MSG_REPORT: "Report",
  MSG_REPORT_CONFIRM_TITLE: "Report this message?",
  MSG_REPORT_CONFIRM_BODY:
    "A copy of this message will be sent to moderation. The sender won't be notified.",
  MSG_REPORT_DONE: "Message reported",
  MSG_PINNED_LABEL: "Pinned message",
  MSG_EDITING_LABEL: "Editing message",
  MSG_EDIT_CANCEL: "Cancel edit",
  MSG_EDIT_SAVE: "Save",
  MSG_EDIT_PLACEHOLDER: "Edit message…",
  REPLY_TO: "Reply to",
  FORWARD_TITLE: "Forward message to…",
  FORWARD_SEND: "Send",
  STARRED_TITLE: "Starred messages",
  STARRED_EMPTY: "Tap and hold a message to star it.",
  EMOJI_PICKER_TITLE: "Pick an emoji",
  EMOJI_RECENT: "Recent",
  // Search
  SEARCH_TITLE: "Search",
  SEARCH_TAB_MESSAGES: "Messages",
  SEARCH_TAB_CONTACTS: "Contacts",
  SEARCH_NO_RESULTS: "No results yet.",
  SEARCH_TYPE_TO_START: "Type to search across your chats.",
  SEARCH_IN_CHAT_PLACEHOLDER: "Search this chat",
  SEARCH_NEXT: "Next match",
  SEARCH_PREV: "Previous match",
  SEARCH_CLOSE: "Close search",
  // Block + Report
  BLOCK: "Block",
  UNBLOCK: "Unblock",
  BLOCK_CONFIRM: "Block this contact?",
  BLOCK_CONFIRM_BODY:
    "Blocked contacts can no longer message you or call you. They won't be notified.",
  UNBLOCK_CONFIRM: "Unblock this contact?",
  UNBLOCK_CONFIRM_BODY:
    "They will be able to send you messages and call you again.",
  BLOCKED_CONTACTS: "Blocked contacts",
  BLOCKED_EMPTY: "You haven't blocked anyone.",
  BLOCKED_HEADER_DESCRIPTION:
    "People you block can't see your last seen, profile photo, status, or message or call you.",
  BLOCKED_BANNER: "You blocked this contact.",
  BLOCKED_BANNER_UNBLOCK: "Tap unblock to message them again.",
  REPORT: "Report",
  REPORT_CONFIRM: "Report this contact?",
  REPORT_CONFIRM_BODY:
    "We'll review the most recent messages from this contact. They won't be notified.",
  // Privacy scope subpages (matching the screenshot)
  PRIVACY_WHO_CAN_SEE_LAST_SEEN: "Who can see my last seen",
  PRIVACY_WHO_CAN_SEE_ONLINE: "Who can see when I'm online",
  PRIVACY_WHO_CAN_SEE_PROFILE_PHOTO: "Who can see my profile photo",
  PRIVACY_WHO_CAN_SEE_ABOUT: "Who can see my about",
  PRIVACY_WHO_CAN_SEE_STATUS: "Who can see my status updates",
  PRIVACY_LAST_SEEN_HINT:
    "If you don't share when you were last seen or online, you won't be able to see when other people were last seen or online.",
  PRIVACY_SAME_AS_LAST_SEEN: "Same as last seen",
  // Search page (dedicated)
  SEARCH_PAGE_TITLE: "Find people",
  SEARCH_PAGE_SUBTITLE: "Search anyone by @handle, name, email or phone.",
  SEARCH_PAGE_PLACEHOLDER: "@handle, name, email or phone",
  SEARCH_PAGE_EMPTY: "Start typing to find people.",
  SEARCH_PAGE_NO_RESULTS: "Nobody matches your search.",
  // Friend request actions
  FRIEND_ADD: "Add friend",
  FRIEND_PENDING: "Pending",
  FRIEND_ACCEPT: "Accept",
  FRIEND_DECLINE: "Decline",
  FRIEND_CANCEL: "Cancel",
  FRIENDS_LABEL: "Friends",
  REQUESTS_TITLE: "Friend requests",
  REQUESTS_INCOMING: "Incoming",
  REQUESTS_OUTGOING: "Sent",
  REQUESTS_EMPTY_INCOMING: "No incoming friend requests.",
  REQUESTS_EMPTY_OUTGOING: "You haven't sent any friend requests.",
  REQUESTS_SENT_TOAST: "Friend request sent",
  NAV_SEARCH: "Find people",
  NAV_REQUESTS: "Friend requests",
  // Notifications hub
  NAV_NOTIFICATIONS: "Notifications",
  NOTIFICATIONS_TITLE: "Notifications",
  NOTIFICATIONS_EMPTY: "You're all caught up.",
  NOTIFICATIONS_MARK_ALL_READ: "Mark all as read",
  NOTIFICATION_FR_TITLE: "New friend request",
  NOTIFICATION_FR_BODY: (handle) => `@${handle} wants to be friends`,
  NOTIFICATION_FR_ACCEPTED_TITLE: "Friend request accepted",
  NOTIFICATION_FR_ACCEPTED_BODY: (handle) =>
    `@${handle} accepted your friend request`,
  NOTIFICATION_GROUP_ADDED_TITLE: "Added to a group",
  NOTIFICATION_GROUP_ADDED_BODY: ({ groupName, by }) =>
    by
      ? `@${by} added you to "${groupName}"`
      : `You were added to "${groupName}"`,
  NOTIFICATION_GROUP_REMOVED_TITLE: "Removed from a group",
  NOTIFICATION_GROUP_REMOVED_BODY: ({ groupName, by }) =>
    by
      ? `@${by} removed you from "${groupName}"`
      : `You were removed from "${groupName}"`,
  // Public profile page
  PROFILE_NOT_FOUND_TITLE: "We couldn't find that profile",
  PROFILE_NOT_FOUND_BODY:
    "The link may be broken, or the user may have changed their @handle.",
  PROFILE_JOINED: "Joined",
  PROFILE_LAST_SEEN: "Last seen",
  PROFILE_ONLINE: "Online now",
  PROFILE_FRIEND_REQ_NEEDED:
    "Send a friend request to start a conversation.",
  PROFILE_OUTGOING_HINT:
    "Friend request sent — you can chat once they accept.",
  PROFILE_INCOMING_HINT: "Accept their friend request to start chatting.",
});

// Quick reactions strip shown above a message on hover (matches WhatsApp Web).
export const QUICK_REACTIONS = Object.freeze([
  "\u{1F44D}",       // 👍
  "\u{2764}\u{FE0F}",// ❤️
  "\u{1F602}",       // 😂
  "\u{1F62E}",       // 😮
  "\u{1F622}",       // 😢
  "\u{1F64F}",       // 🙏
]);

// Small emoji catalogue for the picker — kept inline to avoid a heavy lib.
export const EMOJI_CATALOGUE = Object.freeze({
  Smileys: [
    "\u{1F600}","\u{1F603}","\u{1F604}","\u{1F601}","\u{1F606}",
    "\u{1F605}","\u{1F923}","\u{1F602}","\u{1F642}","\u{1F643}",
    "\u{1F609}","\u{1F60A}","\u{1F607}","\u{1F60D}","\u{1F970}",
    "\u{1F618}","\u{1F617}","\u{1F619}","\u{1F61A}","\u{1F60B}",
  ],
  Gestures: [
    "\u{1F44D}","\u{1F44E}","\u{1F44C}","\u{1F44F}","\u{1F64C}",
    "\u{1F64F}","\u{1F91D}","\u{270C}\u{FE0F}","\u{1F91E}","\u{1F91F}",
    "\u{1F918}","\u{1F90C}","\u{1F90F}","\u{1F44A}","\u{270A}",
  ],
  Hearts: [
    "\u{2764}\u{FE0F}","\u{1F9E1}","\u{1F49B}","\u{1F49A}","\u{1F499}",
    "\u{1F49C}","\u{1F90E}","\u{1F5A4}","\u{1F90D}","\u{2763}\u{FE0F}",
    "\u{1F495}","\u{1F49E}","\u{1F493}",
  ],
  Nature: [
    "\u{1F308}","\u{2600}\u{FE0F}","\u{2601}\u{FE0F}","\u{2744}\u{FE0F}",
    "\u{1F4A7}","\u{1F525}","\u{1F31F}","\u{1F33C}","\u{1F33B}",
    "\u{1F340}","\u{1F332}","\u{1F30A}",
  ],
  Food: [
    "\u{1F354}","\u{1F35F}","\u{1F355}","\u{1F32D}","\u{1F371}",
    "\u{1F363}","\u{1F35C}","\u{1F367}","\u{1F368}","\u{1F382}",
    "\u{1F36B}","\u{2615}","\u{1F37A}",
  ],
});

// Palette used for TEXT statuses (matches WhatsApp Web's options).
export const STATUS_BG = Object.freeze([
  "#075e54",
  "#128c7e",
  "#00a884",
  "#34b7f1",
  "#5b21b6",
  "#c026d3",
  "#d97706",
  "#dc2626",
  "#111b21",
]);

export const STATUS_VIEWER = Object.freeze({
  DEFAULT_DURATION_MS: 5000,
});

// ─── Time durations (ms) ───────────────────────────────────────────────────

export const DURATION = Object.freeze({
  MUTE_8H: 1000 * 60 * 60 * 8,
  MUTE_1W: 1000 * 60 * 60 * 24 * 7,
  MUTE_ALWAYS: 1000 * 60 * 60 * 24 * 365 * 50,
});

// ─── Pagination ────────────────────────────────────────────────────────────

export const PAGE_SIZE = Object.freeze({
  MESSAGES: 40,
  CHATS: 100,
});

// Max attachment size enforced everywhere: client-side guard in the
// pickers + server-side guard in /api/messages/upload.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_UPLOAD_LABEL = "50 MB";
