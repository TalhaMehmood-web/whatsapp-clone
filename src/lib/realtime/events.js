// Re-export SOCKET_EVENT as REALTIME_EVENT. Feature code that already
// imports SOCKET_EVENT keeps working; new code should prefer this name
// so it doesn't look Socket.io-specific.
//
// The string values are identical across providers — Pusher, Ably,
// Supabase Realtime all happily carry "message:new" etc. as opaque
// event names.
export { SOCKET_EVENT as REALTIME_EVENT } from "@/config/constants";
