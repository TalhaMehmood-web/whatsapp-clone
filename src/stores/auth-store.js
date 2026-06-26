import { create } from "zustand";
import { STORAGE_KEY } from "@/config/constants";

// Holds the access token + the current user in memory.
// The refresh token lives in an HttpOnly cookie (see lib/cookies.js).
// The access token is also mirrored to localStorage so the axios interceptor
// can attach it to every request without a React subscription.

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  setSession: ({ user, accessToken }) => {
    if (typeof window !== "undefined" && accessToken) {
      localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, accessToken);
    }
    set({ user, accessToken });
  },

  setUser: (user) => set({ user }),

  clearSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY.ACCESS_TOKEN);
    }
    set({ user: null, accessToken: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(STORAGE_KEY.ACCESS_TOKEN);
    set({ accessToken: token, isHydrated: true });
  },
}));
