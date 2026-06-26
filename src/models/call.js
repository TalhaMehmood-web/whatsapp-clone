/**
 * @typedef {object} Call
 * @property {string} id
 * @property {import("./enums").CallTypeValue} type
 * @property {import("./enums").CallStatusValue} status
 * @property {string | null} startedAt
 * @property {string | null} endedAt
 * @property {string} createdAt
 */

/**
 * @typedef {object} CallParticipant
 * @property {string} id
 * @property {string} callId
 * @property {string} userId
 */

export {};
