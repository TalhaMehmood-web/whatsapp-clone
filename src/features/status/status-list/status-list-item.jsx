"use client";

import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { statusTime } from "@/utils/date-format";
import { StatusRingAvatar } from "./status-ring-avatar";

// One row in the Recent / Viewed sections of the status list.
export function StatusListItem({ contact }) {
  const { user, statuses, allViewed } = contact;
  const latest = statuses[statuses.length - 1];
  const viewedCount = allViewed ? statuses.length : 0;

  return (
    <Link
      href={`${ROUTES.STATUS}/${user.id}`}
      className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-wa-panel-2"
    >
      <StatusRingAvatar
        src={user.avatar}
        name={user.name}
        segments={statuses.length}
        viewedCount={viewedCount}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">{user.name}</span>
        <span className="truncate text-xs text-wa-text-muted">
          {statusTime(latest.createdAt)}
        </span>
      </div>
    </Link>
  );
}
