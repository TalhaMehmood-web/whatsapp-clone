"use client";

import { useState } from "react";
import {
  Copy,
  Link as LinkIcon,
  Loader2,
  RotateCw,
  Trash2,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  useClearGroupInviteHandleMutation,
  useSetGroupInviteHandleMutation,
} from "@/tanstack/groups/mutations";

// GR2 surface inside the group-info sheet. Three states:
//
//   1. No handle yet      → "Create invite link" row (admin) / hidden
//                            for non-admins (matches WhatsApp — only
//                            admins generate/share group invites).
//   2. Handle present     → Show the shareable URL + Copy. Admins also
//                            see Rotate (replaces the slug) and Revoke.
//   3. Non-admin viewing  → Read-only copy row using the existing
//                            handle, so members can re-share what an
//                            admin already created.
//
// The dialog handles set + rotate (same shape — both PATCH); revoke is
// a confirm step on the dialog. Keeps the parent sheet file from
// growing further.
export function GroupInviteLinkRow({ chatId, inviteHandle, canManage }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!inviteHandle && !canManage) {
    return null;
  }

  const fullUrl =
    inviteHandle && typeof window !== "undefined"
      ? `${window.location.origin}/g/${inviteHandle}`
      : null;

  const onCopy = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    toast.success("Invite link copied");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (inviteHandle && !canManage) {
            // Members only get the copy action.
            onCopy();
            return;
          }
          setDialogOpen(true);
        }}
        className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2"
      >
        <LinkIcon className="size-5 shrink-0 text-wa-text-muted" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm text-wa-text">
            {inviteHandle ? "Group invite link" : "Create invite link"}
          </span>
          <span className="truncate text-xs text-wa-text-muted">
            {inviteHandle ? `/g/${inviteHandle}` : "Share this group via URL"}
          </span>
        </div>
        {inviteHandle && (
          <Copy
            className="size-4 shrink-0 text-wa-text-muted"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
          />
        )}
      </button>

      {canManage && (
        <GroupInviteLinkDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          chatId={chatId}
          currentHandle={inviteHandle}
        />
      )}
    </>
  );
}

function GroupInviteLinkDialog({ open, onOpenChange, chatId, currentHandle }) {
  const [value, setValue] = useState(currentHandle ?? "");
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const setHandle = useSetGroupInviteHandleMutation(chatId);
  const clearHandle = useClearGroupInviteHandleMutation(chatId);
  const busy = setHandle.isPending || clearHandle.isPending;

  const isRotate = !!currentHandle && value.trim() !== currentHandle;
  const isCreate = !currentHandle;

  const onSubmit = (e) => {
    e.preventDefault();
    const handle = value.trim().toLowerCase();
    if (!handle) return;
    setHandle.mutate(handle, {
      onSuccess: () => {
        toast.success(isCreate ? "Invite link created" : "Invite link updated");
        onOpenChange(false);
      },
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to save"),
    });
  };

  const onRevoke = () =>
    clearHandle.mutate(undefined, {
      onSuccess: () => {
        toast.success("Invite link revoked");
        setConfirmRevoke(false);
        onOpenChange(false);
      },
      onError: (err) => {
        setConfirmRevoke(false);
        toast.error(err.response?.data?.error ?? "Failed to revoke");
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isCreate ? "Create invite link" : "Group invite link"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Pick a short, memorable handle. Anyone with the link can join."
              : "Share the URL below, or pick a new handle to rotate it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 px-6 pt-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wa-text-muted">
              /g/
            </span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="my-group"
              autoFocus
              className="pl-10"
              maxLength={30}
            />
          </div>
          <p className="text-xs text-wa-text-muted">
            3–30 chars: lowercase letters, numbers, dot or underscore.
          </p>

          <DialogFooter className="-mx-6 mt-2 flex-row items-center justify-between gap-2 border-t border-wa-border px-6 pt-4">
            {currentHandle ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmRevoke(true)}
                disabled={busy}
                className="text-wa-danger hover:text-wa-danger"
              >
                <Trash2 className="mr-2 size-4" />
                Revoke link
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              disabled={busy || !value.trim()}
              loading={setHandle.isPending}
              loadingText={isRotate ? "Updating…" : "Saving…"}
            >
              {isCreate ? (
                <>Create link</>
              ) : isRotate ? (
                <>
                  <RotateCw className="mr-2 size-4" />
                  Rotate link
                </>
              ) : (
                <>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Done</>
              )}
            </Button>
          </DialogFooter>
        </form>

        {confirmRevoke && (
          <div className="border-t border-wa-border bg-wa-panel-2/40 px-6 py-4">
            <p className="text-sm text-wa-text">
              Revoke the invite link? The old URL stops working immediately.
              Existing members stay in the group.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmRevoke(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onRevoke}
                disabled={busy}
                className="bg-wa-danger text-white hover:bg-wa-danger/90"
              >
                Revoke
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
