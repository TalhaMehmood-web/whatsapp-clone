"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

// A single icon button in the left nav rail.
//
// Active state: filled background + accent text (matches WhatsApp Web).
// `badge`:
//   - truthy boolean → small green dot in the corner (unread indicator).
//   - number > 0    → green count pill (friend-request count, etc.).
export function NavRailItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onClick,
}) {
  const numericBadge = typeof badge === "number" && badge > 0;
  const dotBadge = !numericBadge && !!badge;

  const inner = (
    <>
      {/* lucide icons are stroke-only by default. On active we paint
          the fill in currentColor (so the icon adopts the active text
          tone) and thin the stroke — the combo gives the "filled"
          weight WhatsApp Web uses for the selected tab. */}
      <Icon
        className={cn(
          "size-6 transition-colors",
          active && "fill-current [&_path]:stroke-[1.5]",
        )}
      />
      {dotBadge && (
        <span className="absolute right-2 top-2 size-2 rounded-full bg-wa-green" />
      )}
      {numericBadge && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-wa-green px-1 text-[10px] font-medium text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );

  const button = (
    <Button
      asChild={!!href}
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "relative size-11 rounded-lg text-wa-text-muted hover:bg-wa-panel-2 hover:text-wa-text",
        active && "bg-wa-panel-3 text-wa-text",
      )}
      aria-label={label}
    >
      {href ? <Link href={href}>{inner}</Link> : inner}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
