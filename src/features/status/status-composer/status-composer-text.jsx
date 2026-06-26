"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCreateStatusMutation } from "@/tanstack/status/mutations";
import { COPY, ROUTES, STATUS_BG } from "@/config/constants";
import { StatusType } from "@/models/enums";

export function StatusComposerText() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [bgColor, setBgColor] = useState(STATUS_BG[2]);
  const { mutate, isPending } = useCreateStatusMutation();

  const send = () => {
    if (!content.trim() || isPending) return;
    mutate(
      {
        type: StatusType.TEXT,
        content: content.trim(),
        bgColor,
      },
      {
        onSuccess: () => router.replace(ROUTES.STATUS),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not post status"),
      },
    );
  };

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 bg-wa-panel-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.back()}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-sm text-wa-text">{COPY.STATUS_TEXT_BUTTON}</span>
      </header>

      <div
        className="flex flex-1 items-center justify-center px-8 transition-colors"
        style={{ backgroundColor: bgColor }}
      >
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={COPY.STATUS_COMPOSE_PLACEHOLDER}
          className="w-full max-w-xl resize-none bg-transparent text-center text-2xl font-medium text-white placeholder:text-white/60 focus:outline-none"
          rows={4}
        />
      </div>

      <footer className="flex h-16 shrink-0 items-center justify-between gap-3 border-t border-wa-border bg-wa-panel-2 px-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_BG.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Background ${color}`}
              onClick={() => setBgColor(color)}
              className={`size-6 rounded-full border-2 ${
                bgColor === color
                  ? "border-wa-text"
                  : "border-transparent"
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
        <Button
          size="icon"
          aria-label={COPY.STATUS_SEND}
          onClick={send}
          loading={isPending}
          disabled={!content.trim()}
          className="bg-wa-green text-white hover:bg-wa-green/90"
        >
          <SendHorizontal className="size-5" />
        </Button>
      </footer>
    </div>
  );
}
