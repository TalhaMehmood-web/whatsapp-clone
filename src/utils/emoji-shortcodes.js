// Tiny shortcode → emoji map used by the composer when the chat-prefs
// `replaceTextWithEmoji` toggle is on. Mirrors WhatsApp Web's most-used
// shortcuts. We deliberately keep this small — a full emoji lookup would
// bloat the bundle for a feature most users never invoke.
const MAP = {
  ":smile:": "😄",
  ":grin:": "😁",
  ":joy:": "😂",
  ":rofl:": "🤣",
  ":sweat_smile:": "😅",
  ":heart_eyes:": "😍",
  ":kiss:": "😘",
  ":wink:": "😉",
  ":blush:": "😊",
  ":thinking:": "🤔",
  ":expressionless:": "😑",
  ":neutral:": "😐",
  ":cry:": "😢",
  ":sob:": "😭",
  ":angry:": "😠",
  ":rage:": "😡",
  ":sunglasses:": "😎",
  ":heart:": "❤️",
  ":broken_heart:": "💔",
  ":fire:": "🔥",
  ":100:": "💯",
  ":+1:": "👍",
  ":thumbsup:": "👍",
  ":-1:": "👎",
  ":thumbsdown:": "👎",
  ":pray:": "🙏",
  ":clap:": "👏",
  ":wave:": "👋",
  ":ok_hand:": "👌",
  ":muscle:": "💪",
  ":eyes:": "👀",
  ":tada:": "🎉",
  ":star:": "⭐",
  ":check:": "✅",
  ":x:": "❌",
};

// Replace every shortcode occurrence in `text`. Case-sensitive to match
// the WhatsApp behaviour — `:SMILE:` does not collapse to an emoji.
export function replaceEmojiShortcodes(text) {
  if (!text) return text;
  let out = text;
  for (const [shortcode, emoji] of Object.entries(MAP)) {
    if (out.includes(shortcode)) {
      // Escape the colon-wrapped key for use inside a RegExp.
      const re = new RegExp(escapeRegExp(shortcode), "g");
      out = out.replace(re, emoji);
    }
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
