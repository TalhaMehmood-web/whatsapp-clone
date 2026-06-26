"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// One row with a label, the current value, and a pencil that flips it into
// an inline edit + save/cancel. Used by the Profile page for Name and About.
export function InlineEditRow({
  label,
  value,
  placeholder,
  onSave,
  multiline = false,
  saving = false,
  maxLength = 60,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef(null);

  // Sync drafts when the upstream value changes (e.g. cache invalidation).
  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  // Focus the field when we enter edit mode.
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const submit = async () => {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "")) {
      setEditing(false);
      return;
    }
    await onSave(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  return (
    <div className="px-6 py-3">
      <p className="text-xs font-medium text-wa-green">{label}</p>
      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          {multiline ? (
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              className="flex-1 resize-none rounded-md border-0 bg-wa-panel-2 px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none"
              placeholder={placeholder}
              rows={2}
            />
          ) : (
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              placeholder={placeholder}
              className="flex-1"
            />
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Cancel"
            onClick={cancel}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <X className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            aria-label="Save"
            onClick={submit}
            loading={saving}
            className="bg-wa-green text-white hover:bg-wa-green/90"
          >
            <Check className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-wa-text">
            {value || placeholder}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${label}`}
            onClick={() => setEditing(true)}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
