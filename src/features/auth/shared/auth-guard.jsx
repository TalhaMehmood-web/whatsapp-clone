"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/config/constants";

// Wraps any protected route. Redirects to /login when there is no session
// (after hydration is done). Returns null until either the redirect happens
// or the user is confirmed.
export function AuthGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(ROUTES.LOGIN);
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-wa-bg text-wa-text-muted">
        Loading…
      </div>
    );
  }

  return children;
}
