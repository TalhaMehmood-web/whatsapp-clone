"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { usePublicProfileQuery } from "@/tanstack/users/queries";
import { PublicProfileCard } from "@/features/profile/public-profile/public-profile-card";
import { COPY } from "@/config/constants";

export default function PublicProfilePage({ params }) {
  const { handle } = use(params);
  const { data, isLoading, isError } = usePublicProfileQuery(handle);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-wa-bg text-wa-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-wa-bg px-6 text-center text-wa-text-muted">
        <h2 className="text-lg font-medium text-wa-text">
          {COPY.PROFILE_NOT_FOUND_TITLE}
        </h2>
        <p className="mt-2 text-sm">{COPY.PROFILE_NOT_FOUND_BODY}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-wa-bg">
      <PublicProfileCard profile={data} />
    </div>
  );
}
