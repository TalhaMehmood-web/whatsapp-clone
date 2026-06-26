"use client";

import { Bell, BellOff, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { COPY } from "@/config/constants";

// Promotional card the Settings page (and any other landing surface) can
// render to nudge the user into granting notification permission. Once
// permission is granted + subscribed it switches to a quiet "Disable" row.
export function EnablePushCard({ onDismiss }) {
  const { supported, permission, isSubscribed, isPending, subscribe, unsubscribe } =
    usePushSubscription();

  if (!supported) {
    return (
      <div className="mx-4 my-3 flex items-start gap-3 rounded-lg bg-wa-panel-2 px-4 py-3 text-sm text-wa-text-muted">
        <BellOff className="mt-0.5 size-5 shrink-0" />
        <p>{COPY.PUSH_DISABLED}</p>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="mx-4 my-3 flex items-start gap-3 rounded-lg bg-wa-panel-2 px-4 py-3">
        <Bell className="mt-0.5 size-5 shrink-0 text-wa-green" />
        <div className="flex-1">
          <p className="text-sm text-wa-text">Notifications are on.</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={unsubscribe}
          loading={isPending}
        >
          Disable
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-4 my-3 flex items-start gap-3 rounded-lg bg-wa-panel-2 px-4 py-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-wa-green/15 text-wa-green">
        <Lightbulb className="size-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-wa-text">
          {COPY.PUSH_PROMPT_TITLE}
        </p>
        <p className="mt-1 text-xs text-wa-text-muted">
          {permission === "denied"
            ? COPY.PUSH_PERMISSION_BLOCKED
            : COPY.PUSH_PROMPT_BODY}
        </p>
        {permission !== "denied" && (
          <Button
            variant="link"
            className="mt-1 h-auto px-0 text-wa-green"
            onClick={subscribe}
            loading={isPending}
          >
            {COPY.PUSH_PROMPT_CTA}
          </Button>
        )}
      </div>
      {onDismiss && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
