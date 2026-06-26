"use client";

import { useEffect } from "react";
import { useMeQuery } from "@/tanstack/auth/queries";
import { useAuthStore } from "@/stores/auth-store";

// One-stop hook for "who is the current user?".
// Hydrates the access token from localStorage on first render, then keeps the
// store's `user` in sync with the /api/users/me query.
export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  const { data, isLoading, isError } = useMeQuery();

  useEffect(() => {
    if (data && data !== user) setUser(data);
  }, [data, user, setUser]);

  useEffect(() => {
    if (isError && accessToken) clearSession();
  }, [isError, accessToken, clearSession]);

  return {
    user: user ?? data ?? null,
    isAuthenticated: !!user || !!data,
    isLoading: !isHydrated || (!!accessToken && isLoading),
  };
}
