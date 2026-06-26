"use client";

import Link from "next/link";
import { Camera, Pencil } from "lucide-react";
import { COPY, ROUTES } from "@/config/constants";

// The right pane when nobody's status is open. Two big centered circular
// buttons (Text status, Photo and video) per the WhatsApp Web design.
export function StatusEmptyPane() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-wa-bg">
      <div className="flex items-center gap-16">
        <PaneAction
          href={`${ROUTES.STATUS}/new?type=text`}
          icon={<Pencil className="size-7" />}
          label={COPY.STATUS_TEXT_BUTTON}
        />
        <PaneAction
          href={`${ROUTES.STATUS}/new?type=media`}
          icon={<Camera className="size-7" />}
          label={COPY.STATUS_MEDIA_BUTTON}
        />
      </div>
    </div>
  );
}

function PaneAction({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 text-wa-text-muted hover:text-wa-text"
    >
      <span className="grid size-16 place-items-center rounded-full bg-wa-panel-2 transition-colors hover:bg-wa-panel-3">
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
