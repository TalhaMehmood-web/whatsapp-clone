/**
 * @typedef {object} User
 * @property {string} id
 * @property {string | null} handle
 * @property {string | null} phone
 * @property {string | null} email
 * @property {string} name
 * @property {string | null} avatar
 * @property {string | null} about
 * @property {string | null} lastSeen      ISO date string
 * @property {boolean} isOnline
 * @property {string} createdAt             ISO date string
 * @property {string} updatedAt             ISO date string
 */

/**
 * @typedef {object} PrivacySettings
 * @property {string} id
 * @property {string} userId
 * @property {import("./enums").VisibilityScopeValue} lastSeen
 * @property {import("./enums").VisibilityScopeValue} profilePhoto
 * @property {import("./enums").VisibilityScopeValue} about
 * @property {import("./enums").VisibilityScopeValue} status
 * @property {boolean} readReceipts
 * @property {import("./enums").VisibilityScopeValue} groupsPolicy
 * @property {number | null} defaultDisappearing
 * @property {boolean} blockUnknownMessages
 * @property {boolean} linkPreviews
 * @property {boolean} appLockEnabled
 */

/**
 * @typedef {object} ChatPreferences
 * @property {string} id
 * @property {string} userId
 * @property {import("./enums").ThemeValue} theme
 * @property {string | null} wallpaperUrl
 * @property {import("./enums").MediaQualityValue} mediaUploadQuality
 * @property {boolean} autoDownloadPhotos
 * @property {boolean} autoDownloadVideos
 * @property {boolean} autoDownloadDocs
 * @property {boolean} spellCheck
 * @property {boolean} replaceTextWithEmoji
 * @property {boolean} enterIsSend
 * @property {boolean} showPreviews
 * @property {boolean} outgoingSounds
 * @property {boolean} backgroundSync
 */

/**
 * @typedef {object} Block
 * @property {string} id
 * @property {string} blockerId
 * @property {string} blockedId
 * @property {string} createdAt
 */

export {};
