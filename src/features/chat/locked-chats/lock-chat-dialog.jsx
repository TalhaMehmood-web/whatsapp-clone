"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  useLockChatMutation,
  useSetLockedChatsSecretMutation,
  useVerifyLockedChatsSecretMutation,
} from "@/tanstack/chat/mutations";
import { useLockedChatsSecretStatusQuery } from "@/tanstack/chat/queries";
import { COPY } from "@/config/constants";

// Composite dialog for the per-chat lock toggle. Handles three flows in
// one place:
//   1) User has no secret yet — show the setup form (code + confirm).
//   2) Lock-an-unlocked-chat — show "enter your code" with the existing
//      secret (we don't store the plaintext anywhere; the user re-enters).
//   3) Unlock-a-locked-chat — same "enter your code" form, value=false.
//
// Closing without success leaves the chat in its previous state.
export function LockChatDialog({
  open,
  onOpenChange,
  chatId,
  currentlyLocked,
}) {
  const { data: status, isLoading: statusLoading } =
    useLockedChatsSecretStatusQuery();
  const setSecret = useSetLockedChatsSecretMutation();
  const verify = useVerifyLockedChatsSecretMutation();
  const lock = useLockChatMutation();

  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCode("");
      setConfirm("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const needsSetup = !statusLoading && !status?.hasSecret && !currentlyLocked;

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (needsSetup) {
      if (code.length < 4) {
        setError(COPY.LOCKED_CHATS_SETUP_TOO_SHORT);
        return;
      }
      if (code !== confirm) {
        setError(COPY.LOCKED_CHATS_SETUP_MISMATCH);
        return;
      }
      try {
        await setSecret.mutateAsync(code);
      } catch (err) {
        setError(err.response?.data?.error ?? "Failed to set code");
        return;
      }
    }

    try {
      await lock.mutateAsync({
        chatId,
        value: !currentlyLocked,
        secret: code,
      });
      toast.success(
        currentlyLocked ? COPY.UNLOCKED_CHAT_TOAST : COPY.LOCKED_CHAT_TOAST,
      );
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.error ?? COPY.LOCKED_CHATS_UNLOCK_WRONG);
    }
  };

  const submitting = lock.isPending || verify.isPending || setSecret.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span className="grid size-9 place-items-center rounded-full bg-wa-green-soft text-wa-green">
            <Lock className="size-4" />
          </span>
          <div className="flex flex-col">
            <DialogTitle>
              {needsSetup
                ? COPY.LOCKED_CHATS_SETUP_TITLE
                : currentlyLocked
                  ? COPY.LOCKED_CHATS_UNLOCK_TITLE
                  : COPY.LOCK_CHAT}
            </DialogTitle>
            <DialogDescription>
              {needsSetup
                ? COPY.LOCKED_CHATS_SETUP_BODY
                : COPY.LOCKED_CHATS_UNLOCK_BODY}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <PasswordInput
            inputMode="text"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={COPY.LOCKED_CHATS_SETUP_PLACEHOLDER}
          />
          {needsSetup && (
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={COPY.LOCKED_CHATS_SETUP_CONFIRM}
            />
          )}
          {error && (
            <p className="text-xs text-wa-danger" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {COPY.CONFIRM_CANCEL}
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={code.length === 0}
              className="bg-wa-green text-white hover:bg-wa-green/90"
            >
              {needsSetup
                ? COPY.LOCKED_CHATS_SETUP_CTA
                : currentlyLocked
                  ? COPY.LOCKED_CHATS_UNLOCK_CTA
                  : COPY.LOCK_CHAT}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
