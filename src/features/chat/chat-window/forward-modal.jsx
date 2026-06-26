"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, SendHorizontal } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUiStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { useChatsQuery } from "@/tanstack/chat/queries";
import { useForwardMessageMutation } from "@/tanstack/messages/mutations";
import { CHAT_TAB, COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// Single mount in the (main) layout. Reads the target message from the UI
// store; renders the picker on top of every page.
export function ForwardModalHost() {
  const message = useUiStore((s) => s.forwardTarget);
  const close = useUiStore((s) => s.closeForward);

  if (!message) return null;
  return (
    <Dialog open onOpenChange={(v) => !v && close()}>
      <ForwardPicker message={message} onClose={close} />
    </Dialog>
  );
}

function ForwardPicker({ message, onClose }) {
  const { user } = useAuth();
  const { data, isLoading } = useChatsQuery({ tab: CHAT_TAB.ALL });
  const forward = useForwardMessageMutation();
  const [picked, setPicked] = useState(new Set());

  const toggle = (chatId) =>
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(chatId) ? next.delete(chatId) : next.add(chatId);
      return next;
    });

  const send = () => {
    if (picked.size === 0) return;
    forward.mutate(
      { messageId: message.id, chatIds: [...picked] },
      {
        onSuccess: () => {
          toast.success(`Forwarded to ${picked.size} chat${picked.size > 1 ? "s" : ""}`);
          onClose();
        },
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Forward failed"),
      },
    );
  };

  return (
    <DialogContent className="max-w-md p-0">
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>{COPY.FORWARD_TITLE}</DialogTitle>
        <DialogDescription>
          Pick one or more chats to forward this message to.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="mt-2 h-72 px-2">
        {isLoading ? (
          <div className="flex justify-center py-6 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          (data ?? []).map((entry) => {
            const { chat, peers } = entry;
            const peer = peers[0];
            const name = chat.isGroup ? chat.name : peer?.name ?? "Unknown";
            const photo = chat.isGroup ? chat.photo : peer?.avatar;
            const initials = (name ?? "??").slice(0, 2).toUpperCase();
            const selected = picked.has(chat.id);
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => toggle(chat.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-wa-panel-2",
                  selected && "bg-wa-panel-3",
                )}
              >
                <Avatar className="size-9">
                  <AvatarImage src={photo ?? undefined} alt={name} />
                  <AvatarFallback className="bg-wa-panel-3 text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm">{name}</span>
                {selected && (
                  <span className="rounded-full bg-wa-green px-2 py-0.5 text-[10px] text-white">
                    Added
                  </span>
                )}
              </button>
            );
          })
        )}
      </ScrollArea>

      <DialogFooter className="px-6 py-4">
        <Button
          onClick={send}
          loading={forward.isPending}
          disabled={picked.size === 0}
          className="bg-wa-green text-white hover:bg-wa-green/90"
        >
          <SendHorizontal className="mr-2 size-4" />
          {COPY.FORWARD_SEND}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
