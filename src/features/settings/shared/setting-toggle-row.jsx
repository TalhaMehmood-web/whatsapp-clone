"use client";

import { Switch } from "@/components/ui/switch";

// A row with a label + optional description + a Switch on the right.
// Pure presentation — the parent provides the controlled value + handler.
export function SettingToggleRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm text-wa-text">{title}</span>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-wa-text-muted">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={!!checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export function SettingNavRow({ title, description, value, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2"
    >
      {Icon && <Icon className="mt-0.5 size-5 shrink-0 text-wa-text-muted" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">{title}</span>
        {value && (
          <span className="truncate text-xs text-wa-text-muted">{value}</span>
        )}
        {description && (
          // Wrap (not truncate) so longer descriptions like the Account
          // "Security notifications" caption render fully instead of
          // being clipped mid-sentence against the row boundary.
          <span className="text-xs leading-relaxed text-wa-text-muted">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}
