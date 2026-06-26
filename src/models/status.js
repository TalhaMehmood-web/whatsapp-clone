/**
 * @typedef {object} Status
 * @property {string} id
 * @property {string} userId
 * @property {string | null} content
 * @property {string | null} bgColor
 * @property {string | null} font
 * @property {string | null} mediaUrl
 * @property {string | null} mediaMime
 * @property {number | null} mediaDuration
 * @property {string | null} caption
 * @property {import("./enums").StatusTypeValue} type
 * @property {string} expiresAt
 * @property {string} createdAt
 */

/**
 * @typedef {object} StatusView
 * @property {string} id
 * @property {string} statusId
 * @property {string} userId
 * @property {string} viewedAt
 */

export {};
