import { create } from "zustand";

// Misc app-wide ephemeral UI state (not persisted, not in the server cache).
//   - typingByChat: chatId -> Set<userId>
//   - manageLabelsOpen / keyboardShortcutsOpen: single-flag dialogs.
//   - replyByChat: chatId -> message being replied to (or null).
//   - forwardTarget: message being forwarded (or null) — drives the modal.
//   - chatSearchByChat: chatId -> { open: bool, query: string }
//   - settingsPane: stack of subpage ids inside the Settings list. The last
//     entry is the visible pane; an empty stack means "show the section list".
//     Ids look like "profile" or namespaced like "privacy:lastSeen" so the
//     same store can drive nested settings.
export const useUiStore = create((set, get) => ({
  typingByChat: {},
  manageLabelsOpen: false,
  keyboardShortcutsOpen: false,
  replyByChat: {},
  // chatId -> message being edited (or null). Mutually exclusive with
  // replyByChat for the same chat — entering edit mode clears any pending
  // reply, since they share the composer.
  editingByChat: {},
  forwardTarget: null,
  chatSearchByChat: {},
  settingsPane: [],
  // Full-screen media viewer. `items` is the ordered carousel for the
  // current chat; `index` is which one we landed on.
  lightbox: null,
  // chatId -> Set<messageId> of selected messages. Non-empty turns the
  // chat header into the bulk-action bar (delete / forward / star).
  selectionByChat: {},

  setTyping(chatId, userId, typing) {
    const map = { ...get().typingByChat };
    const current = new Set(map[chatId] ?? []);
    if (typing) current.add(userId);
    else current.delete(userId);
    if (current.size === 0) delete map[chatId];
    else map[chatId] = current;
    set({ typingByChat: map });
  },

  openManageLabels: () => set({ manageLabelsOpen: true }),
  closeManageLabels: () => set({ manageLabelsOpen: false }),
  openKeyboardShortcuts: () => set({ keyboardShortcutsOpen: true }),
  closeKeyboardShortcuts: () => set({ keyboardShortcutsOpen: false }),

  setReply: (chatId, message) =>
    set((s) => ({
      replyByChat: { ...s.replyByChat, [chatId]: message ?? null },
      // Starting a reply cancels any in-progress edit on the same chat.
      editingByChat: message
        ? { ...s.editingByChat, [chatId]: null }
        : s.editingByChat,
    })),

  setEditing: (chatId, message) =>
    set((s) => ({
      editingByChat: { ...s.editingByChat, [chatId]: message ?? null },
      replyByChat: message
        ? { ...s.replyByChat, [chatId]: null }
        : s.replyByChat,
    })),

  openForward: (message) => set({ forwardTarget: message }),
  closeForward: () => set({ forwardTarget: null }),

  toggleChatSearch: (chatId) =>
    set((s) => {
      const prev = s.chatSearchByChat[chatId];
      const next = prev?.open
        ? { open: false, query: "" }
        : { open: true, query: prev?.query ?? "" };
      return {
        chatSearchByChat: { ...s.chatSearchByChat, [chatId]: next },
      };
    }),
  setChatSearchQuery: (chatId, query) =>
    set((s) => ({
      chatSearchByChat: {
        ...s.chatSearchByChat,
        [chatId]: { open: true, query },
      },
    })),
  closeChatSearch: (chatId) =>
    set((s) => ({
      chatSearchByChat: {
        ...s.chatSearchByChat,
        [chatId]: { open: false, query: "" },
      },
    })),

  pushSettingsPane: (id) =>
    set((s) => ({ settingsPane: [...s.settingsPane, id] })),
  popSettingsPane: () =>
    set((s) => ({ settingsPane: s.settingsPane.slice(0, -1) })),
  resetSettingsPane: () => set({ settingsPane: [] }),

  openLightbox: ({ items, index = 0 }) =>
    set({ lightbox: { items, index } }),
  closeLightbox: () => set({ lightbox: null }),
  setLightboxIndex: (index) =>
    set((s) => (s.lightbox ? { lightbox: { ...s.lightbox, index } } : {})),

  docPreview: null, // { mediaUrl, mediaMime, fileName } | null
  openDocPreview: (payload) => set({ docPreview: payload }),
  closeDocPreview: () => set({ docPreview: null }),

  toggleMessageSelection: (chatId, messageId) =>
    set((s) => {
      const current = new Set(s.selectionByChat[chatId] ?? []);
      if (current.has(messageId)) current.delete(messageId);
      else current.add(messageId);
      const next = { ...s.selectionByChat };
      if (current.size === 0) delete next[chatId];
      else next[chatId] = current;
      return { selectionByChat: next };
    }),
  startSelection: (chatId, messageId) =>
    set((s) => {
      const current = new Set();
      if (messageId) current.add(messageId);
      return {
        selectionByChat: { ...s.selectionByChat, [chatId]: current },
      };
    }),
  clearSelection: (chatId) =>
    set((s) => {
      const next = { ...s.selectionByChat };
      delete next[chatId];
      return { selectionByChat: next };
    }),
}));
