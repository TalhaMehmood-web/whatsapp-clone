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

  const { data, isFetched, isError } = useMeQuery();

  useEffect(() => {
    if (data && data !== user) setUser(data);
  }, [data, user, setUser]);

  useEffect(() => {
    if (isError && accessToken) clearSession();
  }, [isError, accessToken, clearSession]);

  // `isLoading` covers three "don't redirect yet" windows:
  //   1. localStorage hasn't been read (!isHydrated)
  //   2. We have a token but /me hasn't returned yet — without this, the
  //      tick between "token landed" and "fetch resolves" trips the
  //      AuthGuard's redirect to /login on every full page refresh,
  //      because `useQuery`'s `isLoading` is false while `enabled` was
  //      false up until this moment.
  //   3. The cached user in the store hasn't been populated yet either
  //      (covers the persisted-cache restore path: data may already be
  //      available from IndexedDB but the setUser effect hasn't run).
  return {
    user: user ?? data ?? null,
    isAuthenticated: !!user || !!data,
    isLoading:
      !isHydrated ||
      (!!accessToken && !user && !data && !isFetched && !isError),
  };
}
