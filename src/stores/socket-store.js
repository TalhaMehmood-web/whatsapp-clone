import { create } from "zustand";

// Holds the Socket.IO client instance + a "connected" flag for UI hints.
// The instance itself is created by `use-socket.js` once the user has a token.
export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,
  setSocket: (socket) => set({ socket }),
  setConnected: (isConnected) => set({ isConnected }),
}));
