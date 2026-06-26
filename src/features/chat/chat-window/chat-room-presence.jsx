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

  useEffect(() => {
    if (!chatId) return undefined;
    if (socket) socket.joinChat(chatId);
    markRead(chatId);
    return () => {
      if (socket) socket.leaveChat(chatId);
    };
  }, [chatId, socket, markRead]);

  return null;
}
