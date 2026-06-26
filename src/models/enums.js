// Plain-JS mirrors of the Prisma enums.
// Use these in client code instead of importing @prisma/client (which is
// server-only). Keep values in sync with prisma/schema.prisma.

export const MessageType = Object.freeze({
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  DOCUMENT: "DOCUMENT",
  LOCATION: "LOCATION",
  VOICE_NOTE: "VOICE_NOTE",
  STICKER: "STICKER",
  CONTACT: "CONTACT",
  POLL: "POLL",
  SYSTEM: "SYSTEM",
});

export const MemberRole = Object.freeze({
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
});

export const ReceiptStatus = Object.freeze({
  // Optimistic only — message hasn't reached the server yet (eg. while a
  // media upload is in flight). Never persisted; rendered as a clock icon
  // and replaced with SENT once the server returns the row.
  PENDING: "PENDING",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
});

export const StatusType = Object.freeze({
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
});

export const CallType = Object.freeze({
  VOICE: "VOICE",
  VIDEO: "VIDEO",
});

export const CallStatus = Object.freeze({
  // Caller dialled, callee hasn't accepted yet. Both sides are in the
  // ringing screen — caller sees "Calling…" / "Ringing…", callee sees
  // the IncomingCall modal.
  RINGING: "RINGING",
  // Callee tapped Accept; the screens both render and WebRTC negotiation
  // is in progress.
  ANSWERED: "ANSWERED",
  // PC reached `connected` (we don't persist this — kept for parity).
  ONGOING: "ONGOING",
  // Callee declined the ringing call.
  DECLINED: "DECLINED",
  // Either side dropped the connected call cleanly.
  ENDED: "ENDED",
  // Callee never answered (caller cancelled while ringing, or auto-timeout).
  MISSED: "MISSED",
});

export const VisibilityScope = Object.freeze({
  EVERYONE: "EVERYONE",
  CONTACTS: "CONTACTS",
  CONTACTS_EXCEPT: "CONTACTS_EXCEPT",
  NOBODY: "NOBODY",
});

export const Theme = Object.freeze({
  LIGHT: "LIGHT",
  DARK: "DARK",
  SYSTEM: "SYSTEM",
});

export const MediaQuality = Object.freeze({
  STANDARD: "STANDARD",
  HD: "HD",
});

// Prisma enum for the `Notification.kind` column. Matches the
// `NotificationKind` enum in prisma/schema.prisma — keep in sync.
export const NotificationKind = Object.freeze({
  FRIEND_REQUEST: "FRIEND_REQUEST",
  FRIEND_REQUEST_ACCEPTED: "FRIEND_REQUEST_ACCEPTED",
  GROUP_ADDED: "GROUP_ADDED",
  GROUP_REMOVED: "GROUP_REMOVED",
  MISSED_CALL: "MISSED_CALL",
  SYSTEM: "SYSTEM",
});

// String tags used inside `Message.metadata.kind`. NOT a Prisma enum —
// metadata is a free-form JSON column — but every read/write should go
// through this constant so we keep producers and consumers in sync.
//
// - CALL: SYSTEM-typed message inserted at the end of a 1:1 call (the
//   "Voice call · 02:14" / "Missed video call" centred card).
// - STATUS_REPLY: TEXT-typed message sent from the status viewer's reply
//   composer. Renders the "You · Status" / "<peer> · Status" header card
//   above the reply text.
// - CALL_LINK: TEXT-typed message whose content is a /calls/<id> URL.
//   Renders the green "Join call" card; clicking lazily creates the call
//   via /api/calls/join.
export const MessageMetadataKind = Object.freeze({
  CALL: "call",
  STATUS_REPLY: "status-reply",
  CALL_LINK: "call-link",
});

/**
 * @typedef {typeof MessageType[keyof typeof MessageType]} MessageTypeValue
 * @typedef {typeof MemberRole[keyof typeof MemberRole]} MemberRoleValue
 * @typedef {typeof ReceiptStatus[keyof typeof ReceiptStatus]} ReceiptStatusValue
 * @typedef {typeof StatusType[keyof typeof StatusType]} StatusTypeValue
 * @typedef {typeof CallType[keyof typeof CallType]} CallTypeValue
 * @typedef {typeof CallStatus[keyof typeof CallStatus]} CallStatusValue
 * @typedef {typeof VisibilityScope[keyof typeof VisibilityScope]} VisibilityScopeValue
 * @typedef {typeof Theme[keyof typeof Theme]} ThemeValue
 * @typedef {typeof MediaQuality[keyof typeof MediaQuality]} MediaQualityValue
 * @typedef {typeof NotificationKind[keyof typeof NotificationKind]} NotificationKindValue
 * @typedef {typeof MessageMetadataKind[keyof typeof MessageMetadataKind]} MessageMetadataKindValue
 */
