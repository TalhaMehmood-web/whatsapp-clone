"use client";

import { Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useChatQuery } from "@/tanstack/chat/queries";
import { useBlockedUsersQuery } from "@/tanstack/users/queries";
import { useUnblockUserMutation } from "@/tanstack/users/mutations";
import { useAuth } from "@/hooks/use-auth";
import { COPY } from "@/config/constants";

// Shown in place of MessageInput when the current user has blocked the
// other party in a 1:1 chat. Group chats are unaffected.
// Returns null when no banner is needed so the caller can fall through to
// the normal input.
export function BlockedBanner({ chatId }) {
  const { data } = useChatQuery(chatId);
  const { user } = useAuth();
  const { data: blocked } = useBlockedUsersQuery();
  const unblock = useUnblockUserMutation();

  const chat = data?.chat;
  const peers = data?.peers ?? [];
  const peer = chat?.isGroup ? null : peers[0];
  if (!peer || !user) return null;

  const isBlocked = (blocked ?? []).some((b) => b.id === peer.id);
  if (!isBlocked) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-wa-border bg-wa-panel-2 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3 text-wa-text-muted">
        <Ban className="size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-wa-text">{COPY.BLOCKED_BANNER}</span>
          <span className="text-xs">{COPY.BLOCKED_BANNER_UNBLOCK}</span>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          unblock.mutate(peer.id, {
            onError: (err) =>
              toast.error(err.response?.data?.error ?? "Failed to unblock"),
          })
        }
        loading={unblock.isPending}
      >
        {COPY.UNBLOCK}
      </Button>
    </div>
  );
}
