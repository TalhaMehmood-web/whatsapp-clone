"use client";

import { useEffect } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { useMarkChatReadMutation } from "@/tanstack/chat/mutations";

// Joins the per-chat realtime channel on mount, leaves on unmount, and
// marks the chat as read once. Renders nothing — this is the side-effect
// anchor for the per-chat real-time lifecycle.
//
// History: this used to call `socket.emit("chat:join", id)` against the
// Socket.io server. Post-Pusher migration, `socket` is the bus from
// `lib/realtime/bus.js` and `joinChat` subscribes us to the chat-{id}
// channel directly. The semantics are identical (subscribe / unsubscribe
// with refcounting) so consumers don't see a behaviour change.
export function ChatRoomPresence({ chatId }) {
  const socket = useSocketStore((s) => s.socket);
  const { mutate: markRead } = useMarkChatReadMutation();

  // Split the lifecycle so changing `socket` (null → bus on first ready
  // tick, or reconnect cycle) doesn't re-fire markRead. Without this,
  // every chat visit posted /read twice — once on initial render with a
  // null socket, once when the bus instance landed.

  // Mark-read fires once per chat the user opens. Reruns only when the
  // chatId itself changes.
  useEffect(() => {
    if (!chatId) return;
    markRead(chatId);
  }, [chatId, markRead]);

  // Channel join/leave tracks the socket too because subscribe is only
  // valid against a live bus.
  useEffect(() => {
    if (!chatId || !socket) return undefined;
    socket.joinChat(chatId);
    return () => {
      socket.leaveChat(chatId);
    };
  }, [chatId, socket]);

  return null;
}
