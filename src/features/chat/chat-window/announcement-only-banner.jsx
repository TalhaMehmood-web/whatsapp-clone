import { Megaphone } from "lucide-react";

// Replaces the chat composer for non-admin members of a community
// "Announcements" group. Matches WhatsApp's behaviour: members can
// read every post but only admins post.
export function AnnouncementOnlyBanner() {
  return (
    <div className="flex items-center gap-3 border-t border-wa-border bg-wa-panel-2 px-4 py-3 text-sm text-wa-text-muted">
      <Megaphone className="size-5 shrink-0 text-wa-text-muted" />
      <p>Only community admins can post here.</p>
    </div>
  );
}
