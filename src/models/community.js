/**
 * @typedef {object} Community
 * @property {string} id
 * @property {string} name
 * @property {string | null} photo
 * @property {string | null} description
 * @property {string} createdAt
 */

/**
 * @typedef {object} CommunityMember
 * @property {string} id
 * @property {string} communityId
 * @property {string} userId
 * @property {import("./enums").MemberRoleValue} role
 * @property {string} joinedAt
 */

export {};
