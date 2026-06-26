"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Wraps `next-themes`. Defaults to system preference and toggles class="dark"
// on <html>, which our globals.css uses to switch the CSS variable set.
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
