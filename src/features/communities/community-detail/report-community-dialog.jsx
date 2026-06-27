"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useReportCommunityMutation } from "@/tanstack/communities/mutations";
import { COPY } from "@/config/constants";

// Confirm-and-submit dialog for "Report community". Reason is optional
// — the row goes through either way. Same UX shape as the channel
// report flow inside ChannelInfoSheet.
export function ReportCommunityDialog({ open, onOpenChange, communityId }) {
  const report = useReportCommunityMutation(communityId);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const onSubmit = () =>
    report.mutate(reason.trim() || undefined, {
      onSuccess: () => {
        toast.success("Report submitted");
        onOpenChange(false);
      },
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to report"),
    });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report this community?</AlertDialogTitle>
          <AlertDialogDescription>
            We&apos;ll keep your report private. The community owner won&apos;t
            be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="Optional: tell us what's wrong"
          className="mt-1 w-full rounded-md border border-wa-border bg-wa-panel-2 px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none focus:ring-1 focus:ring-wa-green"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>{COPY.CONFIRM_CANCEL}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onSubmit}
            disabled={report.isPending}
            className="bg-wa-danger text-white hover:bg-wa-danger/90"
          >
            Submit report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
