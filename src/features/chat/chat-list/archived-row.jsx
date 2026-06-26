"use client";

import Link from "next/link";
import { Archive, ChevronRight } from "lucide-react";

import { useArchivedChatsQuery } from "@/tanstack/chat/queries";
import { ROUTES } from "@/config/constants";

// Single row at the top of the main chat list — "Archived (N) >".
// Hidden when the count is zero so the chat list still looks clean for new
// users (matches WhatsApp Web). Tap routes to the dedicated archived view.
export function ArchivedRow() {
  const { data } = useArchivedChatsQuery();
  const count = data?.count ?? 0;
  if (count <= 0) return null;

  return (
    <Link
      href={ROUTES.ARCHIVED}
      className="flex h-12 items-center gap-4 border-b border-wa-border px-4 transition-colors hover:bg-wa-panel-2"
    >
      <Archive className="size-5 text-wa-text-muted" />
      <span className="flex-1 text-sm text-wa-text">Archived</span>
      <span className="text-xs text-wa-text-muted">{count}</span>
      <ChevronRight className="size-4 text-wa-text-muted" />
    </Link>
  );
}
