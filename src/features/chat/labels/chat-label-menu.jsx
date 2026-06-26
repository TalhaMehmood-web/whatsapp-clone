"use client";

import { Tag } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useLabelsQuery } from "@/tanstack/labels/queries";
import { useAssignLabelMutation } from "@/tanstack/labels/mutations";
import { COPY } from "@/config/constants";

// Renders a "Label chat ▸" submenu inside a chat-list-item dropdown.
// `assignedIds` is the set of labels currently on the chat.
// `onManage` opens the global labels manager.
// `triggerLabel` overrides the trigger text (defaults to "Label chat").
export function ChatLabelSubmenu({
  chatId,
  assignedIds,
  onManage,
  triggerLabel = COPY.LABEL_CHAT,
}) {
  const { data: labels } = useLabelsQuery();
  const assign = useAssignLabelMutation(chatId);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Tag className="mr-2 size-4" />
        {triggerLabel}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48">
        <DropdownMenuLabel className="text-[11px] uppercase text-wa-text-muted">
          {COPY.LABELS_ASSIGN_TITLE}
        </DropdownMenuLabel>
        {(labels ?? []).map((label) => {
          const checked = assignedIds?.includes(label.id);
          return (
            <DropdownMenuCheckboxItem
              key={label.id}
              checked={!!checked}
              onCheckedChange={(value) =>
                assign.mutate(
                  { labelId: label.id, value },
                  {
                    onError: (err) =>
                      toast.error(err.response?.data?.error ?? "Failed"),
                  },
                )
              }
            >
              <span
                className="mr-2 inline-block size-2 rounded-full"
                style={{ background: label.color }}
              />
              {label.name}
            </DropdownMenuCheckboxItem>
          );
        })}
        {(labels?.length ?? 0) > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={onManage}>
          Manage labels…
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
