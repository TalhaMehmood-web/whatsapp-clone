"use client";

import { useState } from "react";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLabelsQuery } from "@/tanstack/labels/queries";
import {
  useCreateLabelMutation,
  useDeleteLabelMutation,
} from "@/tanstack/labels/mutations";
import { COPY } from "@/config/constants";

const PALETTE = [
  "#00A884", // green
  "#1F8AC1", // blue
  "#E29A1B", // amber
  "#C13E3E", // red
  "#7C3AED", // violet
  "#6E7A82", // grey
];

export function ManageLabelsModal({ open, onOpenChange }) {
  const { data: labels, isLoading } = useLabelsQuery();
  const create = useCreateLabelMutation();
  const remove = useDeleteLabelMutation();

  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, color },
      {
        onSuccess: () => setName(""),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not create label"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{COPY.LABELS_TITLE}</DialogTitle>
          <DialogDescription>{COPY.LABELS_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3 px-6 pt-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={COPY.LABELS_CREATE_PLACEHOLDER}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Use ${c}`}
                  className={`size-6 rounded-full border-2 ${
                    color === c
                      ? "border-wa-text"
                      : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <Button
              type="submit"
              size="sm"
              loading={create.isPending}
              loadingText="Saving…"
              disabled={!name.trim()}
            >
              <Plus className="mr-1 size-4" />
              {COPY.LABELS_CREATE}
            </Button>
          </div>
        </form>

        <ScrollArea className="mt-2 h-64 px-2 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-6 text-wa-text-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (labels?.length ?? 0) === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-wa-text-muted">
              {COPY.LABELS_NONE}
            </p>
          ) : (
            labels.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-wa-panel-2"
              >
                <Tag className="size-4" style={{ color: l.color }} />
                <span className="flex-1 truncate text-sm">{l.name}</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete label"
                  className="text-wa-text-muted hover:text-wa-danger"
                  onClick={() =>
                    remove.mutate(l.id, {
                      onError: (err) =>
                        toast.error(err.response?.data?.error ?? "Failed"),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
