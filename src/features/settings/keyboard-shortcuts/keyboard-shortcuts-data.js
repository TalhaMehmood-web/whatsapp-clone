// Static keyboard shortcut catalogue. Two columns of pairs rendered in the
// dialog. Editing here updates the dialog automatically.
//
// IMPORTANT: every chord here must match a real handler in
// hooks/use-global-shortcuts.js — otherwise users will press the chip
// and nothing happens. The "Open shortcuts" entry is the escape hatch
// for discovering the rest.
export const KEYBOARD_SHORTCUTS = [
  ["Open keyboard shortcuts", ["?"]],
  ["Close chat", ["Escape"]],
  ["Search chats", ["Ctrl", "Alt", "/"]],
  ["Search in chat", ["Ctrl", "Shift", "F"]],
  ["New chat", ["Ctrl", "Alt", "N"]],
  ["New group", ["Ctrl", "Alt", "Shift", "N"]],
  ["Profile and About", ["Ctrl", "Alt", "P"]],
  ["Mark as unread", ["Ctrl", "Alt", "Shift", "U"]],
  ["Mute (8h)", ["Ctrl", "Alt", "Shift", "M"]],
  ["Archive chat", ["Ctrl", "Alt", "Shift", "E"]],
  ["Pin chat", ["Ctrl", "Alt", "Shift", "P"]],
  ["Label chat", ["Ctrl", "Alt", "Shift", "L"]],
  ["Next chat", ["Ctrl", "Alt", "Shift", "]"]],
  ["Previous chat", ["Ctrl", "Alt", "Shift", "["]],
];
