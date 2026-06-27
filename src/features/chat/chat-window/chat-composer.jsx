"use client";

import { useChatQuery } from "@/tanstack/chat/queries";
import { useBlockedUsersQuery } from "@/tanstack/users/queries";
import { MemberRole } from "@/models/enums";
import { MessageInput } from "./message-input";
import { BlockedBanner } from "./blocked-banner";
import { AnnouncementOnlyBanner } from "./announcement-only-banner";

// Wraps the input + the blocked banner. Renders whichever is appropriate
// based on whether the current user has blocked the 1:1 peer, or
// whether the chat is a community "Announcements" group the caller
// isn't an admin of (CO4 — server enforces the same gate, this UI just
// hides the input so members don't see a send button that errors).
export function ChatComposer({ chatId }) {
  const { data } = useChatQuery(chatId);
  const { data: blocked } = useBlockedUsersQuery();
  const peer = data?.chat?.isGroup ? null : data?.peers?.[0];
  const isBlocked = peer && (blocked ?? []).some((b) => b.id === peer.id);

  if (isBlocked) return <BlockedBanner chatId={chatId} />;

  // Announcement-group gate (CO4 / GR1). For community-linked chats use
  // the caller's community role; for standalone announcement groups
  // fall back to the chat-member role. Server enforces the same.
  const isAnnouncement = data?.chat?.isAnnouncement;
  const communityRole = data?.membership?.communityRole;
  const chatRole = data?.membership?.role;
  const effectiveRole = data?.chat?.communityId ? communityRole : chatRole;
  const canPostAnnouncement =
    effectiveRole === MemberRole.OWNER || effectiveRole === MemberRole.ADMIN;
  if (isAnnouncement && !canPostAnnouncement) {
    return <AnnouncementOnlyBanner />;
  }

  return <MessageInput chatId={chatId} />;
}
