"use client";

import { useSocket } from "@/hooks/use-socket";
import { useChatSocketSync } from "@/hooks/use-chat-socket-sync";
import { useTypingSubscriber } from "@/hooks/use-typing-indicator";
import { useOnlineStatusSync } from "@/hooks/use-online-status";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useFriendRequestsSync } from "@/hooks/use-friend-requests-sync";
import { useNotificationsSync } from "@/hooks/use-notifications-sync";
import { useStatusSync } from "@/hooks/use-status-sync";
import { useUserProfileSync } from "@/hooks/use-user-profile-sync";
import { useCallEvents } from "@/hooks/use-call-events";
import { useHeartbeat } from "@/hooks/use-heartbeat";

// One mount point for every "always on" listener. Sits inside the
// authenticated tree so the socket only opens once the user has a token.
export function SocketBoundary({ children }) {
  useSocket();
  useChatSocketSync();
  useTypingSubscriber();
  useOnlineStatusSync();
  useKeyboardShortcuts();
  useFriendRequestsSync();
  useNotificationsSync();
  useStatusSync();
  useUserProfileSync();
  useHeartbeat();
  useCallEvents();
  return children;
}
