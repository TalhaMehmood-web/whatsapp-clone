"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

// Compose every client-side provider here. Add new providers (auth, socket,
// etc.) by wrapping `children` further inside this component — the root
// layout stays untouched.
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
