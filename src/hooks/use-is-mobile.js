"use client";

import { useEffect, useState } from "react";

const QUERY = "(max-width: 767px)";

// Tiny `matchMedia` wrapper. Returns true under Tailwind's `md` breakpoint.
// Renders `false` on the server so the initial SSR markup matches the
// desktop layout — the value flips on the first client paint.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}
