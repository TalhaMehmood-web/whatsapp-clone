"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Wraps a settings detail page when rendered on its own URL (e.g. via a
// deep-link to /settings/privacy). The SlidePane host already provides the
// header + scroll area, so when a section is rendered inside the pane stack
// it should pass `inline` to skip this wrapper.
export function SettingsSection({ title, inline = false, children }) {
  const router = useRouter();
  if (inline) return <>{children}</>;
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => router.back()}
          className="text-wa-text-muted hover:text-wa-text"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-medium text-wa-text">{title}</h2>
      </header>
      <ScrollArea className="flex-1">{children}</ScrollArea>
    </div>
  );
}

export function SettingsGroupLabel({ children }) {
  return (
    <div className="px-6 pt-5 pb-2 text-xs font-medium text-wa-green">
      {children}
    </div>
  );
}
