"use client";

import { useMemo } from "react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/use-auth";
import { useReactToMessageMutation } from "@/tanstack/messages/mutations";

// Aggregates raw reaction rows by emoji and renders them as a small pill.
// Clicking a pill toggles your own reaction (matches WhatsApp Web).
export function MessageReactions({ message, align = "start" }) {
  const { user } = useAuth();
  const react = useReactToMessageMutation(message.chatId);

  const groups = useMemo(() => {
    const map = new Map();
    for (const r of message.reactions ?? []) {
      const key = r.emoji;
      const g = map.get(key) ?? { emoji: key, count: 0, mine: false };
      g.count += 1;
      if (r.userId === user?.id) g.mine = true;
      map.set(key, g);
    }
    return [...map.values()];
  }, [message.reactions, user?.id]);

  if (groups.length === 0) return null;

  return (
    <div
      className={cn(
        "-mt-1 flex w-full px-3",
        align === "end" ? "justify-end" : "justify-start",
      )}
    >
      <div className="flex max-w-[65%] flex-wrap gap-1">
        {groups.map((g) => (
          <button
            key={g.emoji}
            type="button"
            onClick={() =>
              react.mutate({ messageId: message.id, emoji: g.emoji })
            }
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-none shadow-sm",
              g.mine
                ? "bg-wa-green-soft text-wa-green"
                : "bg-wa-panel-2 text-wa-text",
            )}
          >
            <span>{g.emoji}</span>
            {g.count > 1 && <span>{g.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
