"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

// Input that defaults to `type="password"` and adds a trailing eye-toggle
// button. Forwards every other prop straight through to the underlying
// Input — drop-in replacement wherever you need a masked text field with
// the WhatsApp-style "show/hide" eye.
export const PasswordInput = forwardRef(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={visible ? "Hide secret code" : "Show secret code"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-wa-text-muted hover:text-wa-text"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
});
