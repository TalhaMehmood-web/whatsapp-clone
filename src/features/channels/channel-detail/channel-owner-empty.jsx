"use client";

import { useState } from "react";
import { Link as LinkIcon, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EditDescriptionDialog } from "./edit-description-dialog";

// Shown in place of the post feed when an owner opens a channel with
// zero posts. Mirrors WhatsApp's "set up your channel" empty-state
// nudges so the surface isn't blank before the first post.
export function ChannelOwnerEmpty({ channel }) {
  const [editOpen, setEditOpen] = useState(false);

  const onCopyLink = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/ch/${channel.handle}`;
    await navigator.clipboard.writeText(url);
    toast.success("Channel link copied");
  };

  return (
    <>
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-wa-border bg-wa-panel p-6 text-center">
        <h3 className="text-lg font-medium text-wa-text">
          Share your first update
        </h3>
        <p className="text-sm text-wa-text-muted">
          Set the stage before you post. Add a description so followers know
          what to expect, then share the channel link.
        </p>
        <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 border-wa-border bg-wa-panel-2 text-wa-text hover:bg-wa-panel-3"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 size-4" />
            {channel.description ? "Edit description" : "Add description"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-wa-border bg-wa-panel-2 text-wa-text hover:bg-wa-panel-3"
            onClick={onCopyLink}
          >
            <LinkIcon className="mr-2 size-4" />
            Share channel link
          </Button>
        </div>
      </div>

      <EditDescriptionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        channelId={channel.id}
        initialValue={channel.description}
      />
    </>
  );
}
