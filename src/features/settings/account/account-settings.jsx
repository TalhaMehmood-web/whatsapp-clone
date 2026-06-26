"use client";

import { ChevronRight, FileText, Info, ShieldCheck } from "lucide-react";
import { COPY } from "@/config/constants";
import { SettingsSection } from "@/features/settings/shared/settings-section";

export function AccountSettings({ inline = false }) {
  const rows = [
    { icon: ShieldCheck, label: COPY.ACCOUNT_SECURITY },
    { icon: FileText, label: COPY.ACCOUNT_REQUEST_INFO },
    { icon: Info, label: COPY.ACCOUNT_DELETE },
  ];
  return (
    <SettingsSection title={COPY.SETTINGS_ACCOUNT} inline={inline}>
      <div className="mt-2">
        {rows.map((r) => (
          <button
            key={r.label}
            type="button"
            className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2"
          >
            <r.icon className="size-5 text-wa-text-muted" />
            <span className="flex-1 text-sm text-wa-text">{r.label}</span>
            <ChevronRight className="size-4 text-wa-text-muted" />
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
