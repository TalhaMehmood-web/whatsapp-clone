/**
 * @typedef {object} Message
 * @property {string} id
 * @property {string} chatId
 * @property {string} senderId
 * @property {string | null} content
 * @property {import("./enums").MessageTypeValue} type
 * @property {string | null} mediaUrl
 * @property {string | null} mediaMime
 * @property {string | null} mediaThumbUrl
 * @property {number | null} mediaSizeBytes
 * @property {number | null} mediaDuration
 * @property {string | null} fileName
 * @property {string | null} caption
 * @property {string | null} replyToId
 * @property {string | null} forwardedFrom
 * @property {number} forwardCount
 * @property {string | null} expiresAt
 * @property {string | null} editedAt
 * @property {string | null} deletedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} MessageReceipt
 * @property {string} id
 * @property {string} messageId
 * @property {string} userId
 * @property {import("./enums").ReceiptStatusValue} status
 * @property {string | null} deliveredAt
 * @property {string | null} seenAt
 */

/**
 * @typedef {object} Reaction
 * @property {string} id
 * @property {string} messageId
 * @property {string} userId
 * @property {string} emoji
 * @property {string} createdAt
 */

/**
 * @typedef {object} StarredMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} messageId
 * @property {string} starredAt
 */

/**
 * Paged response from GET /api/chats/:id/messages.
 * @typedef {object} MessagePage
 * @property {Message[]} messages
 * @property {string | null} nextCursor
 */

export {};
