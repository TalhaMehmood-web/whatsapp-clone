"use client";

import { Clock4 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChatQuery } from "@/tanstack/chat/queries";
import { useSetDisappearingMutation } from "@/tanstack/chat/mutations";
import { cn } from "@/utils/cn";
import { COPY } from "@/config/constants";

const OPTIONS = [
  { label: COPY.DISAPPEARING_OFF, value: null },
  { label: COPY.DISAPPEARING_24H, value: 60 * 60 * 24 },
  { label: COPY.DISAPPEARING_7D, value: 60 * 60 * 24 * 7 },
  { label: COPY.DISAPPEARING_90D, value: 60 * 60 * 24 * 90 },
];

// Per-chat disappearing-messages picker. Single column of choices —
// tapping any one persists immediately and closes the dialog.
export function DisappearingMessagesDialog({ chatId, open, onOpenChange }) {
  const { data } = useChatQuery(chatId);
  const set = useSetDisappearingMutation(chatId);
  const current = data?.chat?.disappearingSeconds ?? null;

  const pick = (value) => {
    set.mutate(value, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to update"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span className="grid size-9 place-items-center rounded-full bg-wa-green-soft text-wa-green">
            <Clock4 className="size-4" />
          </span>
          <div className="flex flex-col">
            <DialogTitle>{COPY.DISAPPEARING_DIALOG_TITLE}</DialogTitle>
            <DialogDescription>
              {COPY.DISAPPEARING_DIALOG_BODY}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ul className="flex flex-col">
          {OPTIONS.map((opt) => {
            const checked = current === opt.value;
            return (
              <li key={opt.label}>
                <button
                  type="button"
                  onClick={() => pick(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-wa-panel-2",
                    checked && "bg-wa-panel-2/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border-2",
                      checked ? "border-wa-green" : "border-wa-text-muted",
                    )}
                  >
                    {checked && (
                      <span className="size-2 rounded-full bg-wa-green" />
                    )}
                  </span>
                  <span className="text-sm text-wa-text">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
