"use client";

import { Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

// Generic "header + empty body" used by routes whose real list pane lands in
// a later phase. Keeps the shell visually consistent across pages.
export function ListPanePlaceholder({ title, action = true }) {
  return (
    <>
      <header className="flex h-16 items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-wa-text">{title}</h1>
        <div className="flex items-center gap-1 text-wa-text-muted">
          {action && (
            <Button variant="ghost" size="icon" aria-label={`New ${title.toLowerCase()}`}>
              <Plus className="size-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 px-4 py-6 text-sm text-wa-text-muted">
        Nothing here yet.
      </div>
    </>
  );
}
