import { create } from "zustand";

// Tracks the live realtime connection. `handle` is whatever the active
// adapter (Pusher today) returned from connect() — opaque to consumers.
// `isConnected` drives the connection indicator in the UI.
//
// `bus` is a tiny Socket.io-compatible event emitter wrapper around the
// underlying client. Existing sync hooks call `bus.on(event, fn)` /
// `bus.off(event, fn)` exactly like the old `socket.on/off` API. The bus
// internally tracks which channels each event needs and subscribes/
// unsubscribes as listeners come and go. Single hot path for all sync
// hooks; they don't need to know about channels.
export const useRealtimeStore = create((set) => ({
  handle: null,
  bus: null,
  isConnected: false,
  setHandle: (handle) => set({ handle }),
  setBus: (bus) => set({ bus }),
  setConnected: (isConnected) => set({ isConnected }),
}));
