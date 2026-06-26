"use client";

import { ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisibilityScope } from "@/models/enums";

const LABEL = {
  [VisibilityScope.EVERYONE]: "Everyone",
  [VisibilityScope.CONTACTS]: "My contacts",
  [VisibilityScope.CONTACTS_EXCEPT]: "My contacts except…",
  [VisibilityScope.NOBODY]: "Nobody",
};

// One privacy row that exposes a visibility scope. Renders the current label
// + opens a dropdown radio group for the choices.
export function ScopePickerRow({ title, value, onChange, disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2 disabled:opacity-50"
        >
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-wa-text">{title}</span>
            <span className="truncate text-xs text-wa-text-muted">
              {LABEL[value] ?? "Not set"}
            </span>
          </div>
          <ChevronRight className="size-4 text-wa-text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {Object.values(VisibilityScope).map((scope) => (
            <DropdownMenuRadioItem key={scope} value={scope}>
              {LABEL[scope]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
