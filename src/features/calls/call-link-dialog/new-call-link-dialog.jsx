"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Phone,
  SendHorizontal,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSendMessageMutation } from "@/tanstack/messages/mutations";
import {
  CallType,
  MessageMetadataKind,
  MessageType,
} from "@/models/enums";
import { ROUTES } from "@/config/constants";

// "New call link" dialog opened from the chat-header overflow menu.
//
// Matches the WA Web layout: type picker (Video / Voice), a read-only
// URL with copy, a require-approval toggle, and a "Send link to chat"
// CTA that posts the URL as a normal text message — but with metadata
// so the recipient sees the styled call-link card with a "Join call"
// button.
//
// Key behavioural difference from the earlier version: we do NOT start
// a real call when the dialog opens. We just mint a client-side id and
// the actual Call row is created lazily when someone clicks Join call.
// That way the recipient doesn't get ringed before they've accepted the
// invitation.
export function NewCallLinkDialog({
  open,
  onOpenChange,
  chatId,
  participantIds,
}) {
  const [type, setType] = useState(CallType.VIDEO);
  const [requireApproval, setRequireApproval] = useState(false);
  // Mint a new id every time the dialog opens or the type flips.
  const [seed, setSeed] = useState(0);
  const callId = useMemo(() => generateCallId(), [open, type, seed]);

  const send = useSendMessageMutation(chatId);

  useEffect(() => {
    if (!open) setSeed((s) => s + 1);
  }, [open]);

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${ROUTES.CALLS}/${callId}`;
  }, [callId]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const onSend = async () => {
    if (!url || !chatId) return;
    try {
      await send.mutateAsync({
        content: url,
        type: MessageType.TEXT,
        metadata: {
          kind: MessageMetadataKind.CALL_LINK,
          callId,
          callType: type,
          requireApproval,
          // Lazily-create needs to know who the chat is between so the
          // first joiner's Call row has the right participants.
          participantIds,
        },
      });
      toast.success("Call link sent");
      onOpenChange(false);
    } catch (err) {
      const detail =
        err?.response?.data?.error ?? err?.message ?? "Could not send link";
      toast.error(detail);
      // eslint-disable-next-line no-console
      console.error("send call link failed", err);
    }
  };

  const TypeIcon = type === CallType.VIDEO ? Video : Phone;
  const typeLabel = type === CallType.VIDEO ? "Video" : "Voice";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle>New call link</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="border-wa-green text-wa-green hover:bg-wa-green-soft"
              >
                <TypeIcon className="mr-2 size-4" />
                {typeLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => setType(CallType.VIDEO)}
                className="flex items-center gap-2"
              >
                <Video className="size-4" />
                Video
                {type === CallType.VIDEO && (
                  <span className="ml-auto text-wa-green">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setType(CallType.VOICE)}
                className="flex items-center gap-2"
              >
                <Phone className="size-4" />
                Voice
                {type === CallType.VOICE && (
                  <span className="ml-auto text-wa-green">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex flex-1 items-center gap-1 rounded-md bg-wa-panel-2 px-3 py-2 text-sm">
            <input
              readOnly
              value={url}
              className="flex-1 truncate border-0 bg-transparent text-wa-text outline-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Copy link"
              onClick={onCopy}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-wa-text-muted">
          Anyone using a recent version of WhatsApp can use this link to
          join this call. Only share it with people you trust.
        </p>

        <div className="flex items-center justify-between rounded-md bg-wa-panel-2 px-3 py-2">
          <span className="text-sm text-wa-text">Require approval to join</span>
          <Switch
            checked={requireApproval}
            onCheckedChange={setRequireApproval}
          />
        </div>

        <Button
          type="button"
          onClick={onSend}
          loading={send.isPending}
          className="w-full rounded-full bg-wa-green text-white hover:bg-wa-green/90"
        >
          <SendHorizontal className="mr-2 size-4" />
          Send link to chat
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Match Prisma cuid shape — short, URL-safe, no collisions in practice.
// We generate client-side so opening the dialog doesn't ping the server
// (the actual Call row is created when someone clicks Join call).
function generateCallId() {
  // 16 hex chars + a "link-" prefix to distinguish from dialled call ids
  // in logs. Plenty of entropy for our use case.
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return `link-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  )}`;
}
