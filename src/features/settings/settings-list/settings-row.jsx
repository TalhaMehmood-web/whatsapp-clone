"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export function SettingsRow({
  href,
  icon: Icon,
  title,
  description,
  onClick,
  destructive,
  chevron = true,
}) {
  const pathname = usePathname();
  const active = href && (pathname === href || pathname.startsWith(`${href}/`));

  const inner = (
    <span
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-wa-panel-2",
        active && "bg-wa-panel-3",
        destructive && "text-wa-danger",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "size-5 shrink-0",
            destructive ? "text-wa-danger" : "text-wa-text-muted",
          )}
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("truncate text-sm", destructive ? "text-wa-danger" : "text-wa-text")}>
          {title}
        </span>
        {description && (
          <span className="truncate text-xs text-wa-text-muted">
            {description}
          </span>
        )}
      </span>
      {chevron && href && <ChevronRight className="size-4 text-wa-text-muted" />}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}
