"use client";

import { Smile } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { COPY, EMOJI_CATALOGUE } from "@/config/constants";

const CATEGORIES = Object.keys(EMOJI_CATALOGUE);

// Tabbed emoji picker. Clicking an emoji passes it back to the parent so
// the input can insert it at the caret position.
export function EmojiPicker({ onPick, className }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Emoji"
          className={
            className ?? "text-wa-text-muted hover:text-wa-text"
          }
        >
          <Smile className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-80 p-0">
        <Tabs defaultValue={CATEGORIES[0]} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-wa-border bg-transparent px-2">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((c) => (
            <TabsContent key={c} value={c} className="m-0 p-0">
              <ScrollArea className="h-56">
                <div className="grid grid-cols-8 gap-1 p-2 text-2xl">
                  {EMOJI_CATALOGUE[c].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onPick(emoji)}
                      className="rounded hover:bg-wa-panel-2"
                      aria-label={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        <p className="border-t border-wa-border px-3 py-1.5 text-[10px] text-wa-text-muted">
          {COPY.EMOJI_PICKER_TITLE}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
