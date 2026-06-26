import { create } from "zustand";
import { CHAT_TAB } from "@/config/constants";

// Local UI state for the chat list — selected filter tab + the search term.
// Persistent server data lives in TanStack Query, not here.
export const useChatStore = create((set) => ({
  tab: CHAT_TAB.ALL,
  search: "",
  setTab: (tab) => set({ tab }),
  setSearch: (search) => set({ search }),
}));
