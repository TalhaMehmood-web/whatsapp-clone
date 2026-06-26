"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";

import {
  useLockedChatsQuery,
  useLockedChatsSecretStatusQuery,
} from "@/tanstack/chat/queries";
import { useVerifyLockedChatsSecretMutation } from "@/tanstack/chat/mutations";
import { COPY, ROUTES } from "@/config/constants";

import { UnlockGateDialog } from "./unlock-gate-dialog";

// "Locked chats (N)" row above the main chat list. Hidden when nothing
// is locked. Tapping prompts for the secret code; on success we route to
// the dedicated /locked screen which renders the actual list.
export function LockedChatsEntryRow() {
  const router = useRouter();
  const { data } = useLockedChatsQuery();
  const { data: status } = useLockedChatsSecretStatusQuery();
  const [gateOpen, setGateOpen] = useState(false);

  const count = data?.count ?? 0;
  if (count <= 0 || !status?.hasSecret) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setGateOpen(true)}
        className="flex h-12 w-full items-center gap-4 border-b border-wa-border px-4 transition-colors hover:bg-wa-panel-2"
      >
        <Lock className="size-5 text-wa-text-muted" />
        <span className="flex-1 text-left text-sm text-wa-text">
          {COPY.LOCKED_CHATS_BANNER}
        </span>
        <span className="text-xs text-wa-text-muted">{count}</span>
        <ChevronRight className="size-4 text-wa-text-muted" />
      </button>

      <UnlockGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        onUnlocked={() => {
          setGateOpen(false);
          router.push(ROUTES.LOCKED_CHATS);
        }}
      />
    </>
  );
}
