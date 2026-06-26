"use client";

import { useTheme } from "next-themes";
import { ChevronRight, Moon, Sun, Laptop } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COPY, THEME } from "@/config/constants";

const LABEL = {
  [THEME.LIGHT]: "Light",
  [THEME.DARK]: "Dark",
  [THEME.SYSTEM]: "System default",
};

const ICON = {
  [THEME.LIGHT]: Sun,
  [THEME.DARK]: Moon,
  [THEME.SYSTEM]: Laptop,
};

// Drives the next-themes provider. The chat-prefs `theme` field is a
// server-side mirror; this picker writes to next-themes for the active
// session and the next time the user logs in.
export function ThemeRow() {
  const { theme, setTheme } = useTheme();
  const value = theme ?? THEME.SYSTEM;
  const Icon = ICON[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Icon className="size-5 text-wa-text-muted" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-wa-text">
                {COPY.CHAT_PREFS_THEME}
              </span>
              <span className="truncate text-xs text-wa-text-muted">
                {LABEL[value]}
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 text-wa-text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={setTheme}>
          <DropdownMenuRadioItem value={THEME.LIGHT}>Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={THEME.DARK}>Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={THEME.SYSTEM}>
            System default
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
