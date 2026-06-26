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
import { usePrivacyQuery } from "@/tanstack/users/queries";
import { useUpdatePrivacyMutation } from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import { cn } from "@/utils/cn";

// "Default message timer" picker. Sets `PrivacySettings.defaultDisappearing`
// which `startDirectChat` reads when seeding a new 1:1 chat — existing
// chats are NOT touched, matching WhatsApp's behaviour.
//
// Same option set as the per-chat picker, but writes to the privacy row
// instead of the chat row.
const OPTIONS = [
  { label: COPY.DISAPPEARING_OFF, value: null },
  { label: COPY.DISAPPEARING_24H, value: 60 * 60 * 24 },
  { label: COPY.DISAPPEARING_7D, value: 60 * 60 * 24 * 7 },
  { label: COPY.DISAPPEARING_90D, value: 60 * 60 * 24 * 90 },
];

export function DisappearingDefaultDialog({ open, onOpenChange }) {
  const { data: privacy } = usePrivacyQuery();
  const update = useUpdatePrivacyMutation();
  const current = privacy?.defaultDisappearing ?? null;

  const pick = (value) => {
    update.mutate(
      { defaultDisappearing: value },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span className="grid size-9 place-items-center rounded-full bg-wa-green-soft text-wa-green">
            <Clock4 className="size-4" />
          </span>
          <div className="flex flex-col">
            <DialogTitle>{COPY.PRIVACY_DEFAULT_TIMER}</DialogTitle>
            <DialogDescription>
              {COPY.PRIVACY_DEFAULT_TIMER_HINT}
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
                  disabled={update.isPending}
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

// Render-time helper so the Privacy index row can show "24 hours" /
// "7 days" / "90 days" / "Off" instead of raw seconds.
export function formatDisappearingDefault(seconds) {
  if (!seconds) return COPY.DISAPPEARING_OFF;
  const day = 60 * 60 * 24;
  if (seconds === day) return COPY.DISAPPEARING_24H;
  if (seconds === day * 7) return COPY.DISAPPEARING_7D;
  if (seconds === day * 90) return COPY.DISAPPEARING_90D;
  return `${Math.round(seconds / day)} days`;
}
