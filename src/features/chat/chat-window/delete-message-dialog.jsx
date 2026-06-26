"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COPY } from "@/config/constants";

// WhatsApp-style three-option delete prompt. Left-aligned title, then a
// stack of right-aligned outlined-green pill buttons in the lower-right
// of the dialog — matches the WA Web design.
//
//   - "Delete for everyone": tombstones the message for all viewers.
//     Only the sender can do this; gated by `canDeleteForEveryone`.
//   - "Delete for me": hides the message for the current user only.
//   - "Cancel": closes.
//
// `count` pluralises the title for bulk deletes from the selection bar.
export function DeleteMessageDialog({
  open,
  onOpenChange,
  count = 1,
  canDeleteForEveryone,
  onDeleteForEveryone,
  onDeleteForMe,
}) {
  const title = count > 1 ? `Delete ${count} messages?` : "Delete message?";

  // Shared button styling — outlined green pill with transparent
  // background, slight hover wash.
  const pill =
    "rounded-md border border-wa-green/40 bg-transparent px-5 text-wa-green shadow-none hover:bg-wa-green-soft hover:text-wa-green";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-6 p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-medium text-wa-text">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose how to delete the message.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-end gap-3">
          {canDeleteForEveryone && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onDeleteForEveryone}
              className={pill}
            >
              Delete for everyone
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onDeleteForMe}
            className={pill}
          >
            Delete for me
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={pill}
          >
            {COPY.CONFIRM_CANCEL}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
