"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";

// Avatar wrapped in a segmented ring. Green segments for unviewed, grey
// segments for viewed. `segments` is the number of statuses the user has
// posted; `viewedCount` is how many of those the current user has watched.
export function StatusRingAvatar({
  src,
  name,
  segments = 1,
  viewedCount = 0,
  size = 48,
}) {
  const initials = (name ?? "??").slice(0, 2).toUpperCase();
  const gapPct = segments > 1 ? 4 : 0;
  const segmentPct = (100 - gapPct * segments) / segments;
  const gradients = [];
  let cursor = 0;
  for (let i = 0; i < segments; i++) {
    const color = i < viewedCount ? "#5e6e76" : "#00a884";
    gradients.push(`${color} ${cursor}%`);
    cursor += segmentPct;
    gradients.push(`${color} ${cursor}%`);
    if (i < segments - 1) {
      gradients.push(`transparent ${cursor}%`);
      cursor += gapPct;
      gradients.push(`transparent ${cursor}%`);
    }
  }

  return (
    <div
      className="grid place-items-center rounded-full p-[2px]"
      style={{
        width: size,
        height: size,
        backgroundImage: `conic-gradient(from 90deg, ${gradients.join(", ")})`,
      }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-wa-panel p-[2px]">
        <Avatar
          className={cn("rounded-full")}
          style={{ width: size - 8, height: size - 8 }}
        >
          <AvatarImage src={src ?? undefined} alt={name} />
          <AvatarFallback className="bg-wa-panel-3 text-xs text-wa-text">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
