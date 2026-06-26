/**
 * @typedef {object} Chat
 * @property {string} id
 * @property {boolean} isGroup
 * @property {string | null} name
 * @property {string | null} photo
 * @property {string | null} description
 * @property {string | null} communityId
 * @property {string | null} pinnedMessageId
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} ChatMember
 * @property {string} id
 * @property {string} chatId
 * @property {string} userId
 * @property {import("./enums").MemberRoleValue} role
 * @property {string} joinedAt
 * @property {boolean} isPinned
 * @property {boolean} isFavourite
 * @property {boolean} isArchived
 * @property {string | null} mutedUntil
 * @property {number} unreadCount
 * @property {string | null} lastReadAt
 */

/**
 * @typedef {object} Label
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} color
 * @property {string} createdAt
 */

/**
 * Chat row payload as shipped to the chat-list UI.
 * @typedef {object} ChatListEntry
 * @property {Chat} chat
 * @property {ChatMember} membership
 * @property {import("./message").Message | null} lastMessage
 * @property {import("./user").User[]} peers   For 1:1 chats, the other user.
 * @property {string[]} labelIds              Ids of the current user's labels assigned to this chat.
 */

export {};
