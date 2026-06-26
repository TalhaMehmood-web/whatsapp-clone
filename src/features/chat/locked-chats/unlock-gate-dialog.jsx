"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

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
import { useVerifyLockedChatsSecretMutation } from "@/tanstack/chat/mutations";
import { COPY } from "@/config/constants";

// Dialog presented when the user wants to *view* the locked-chats list
// (vs. lock or unlock a single chat). Verifies the secret and calls
// `onUnlocked` so the caller can route. The unlocked state is held by
// the caller in memory — no persistence, refresh re-locks.
export function UnlockGateDialog({ open, onOpenChange, onUnlocked }) {
  const verify = useVerifyLockedChatsSecretMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setCode("");
      setError("");
    }
  }, [open]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const result = await verify.mutateAsync(code);
      if (result?.ok) {
        onUnlocked?.();
      } else {
        setError(COPY.LOCKED_CHATS_UNLOCK_WRONG);
      }
    } catch (err) {
      setError(err.response?.data?.error ?? COPY.LOCKED_CHATS_UNLOCK_WRONG);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span className="grid size-9 place-items-center rounded-full bg-wa-green-soft text-wa-green">
            <Lock className="size-4" />
          </span>
          <div className="flex flex-col">
            <DialogTitle>{COPY.LOCKED_CHATS_UNLOCK_TITLE}</DialogTitle>
            <DialogDescription>
              {COPY.LOCKED_CHATS_UNLOCK_BODY}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <PasswordInput
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={COPY.LOCKED_CHATS_SETUP_PLACEHOLDER}
          />
          {error && (
            <p className="text-xs text-wa-danger" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={verify.isPending}
            >
              {COPY.CONFIRM_CANCEL}
            </Button>
            <Button
              type="submit"
              loading={verify.isPending}
              disabled={!code}
              className="bg-wa-green text-white hover:bg-wa-green/90"
            >
              {COPY.LOCKED_CHATS_UNLOCK_CTA}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
