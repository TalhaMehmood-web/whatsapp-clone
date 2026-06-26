import { COPY } from "@/config/constants";
import { SettingsSection } from "@/features/settings/shared/settings-section";

export default function SettingsHelpPage() {
  return (
    <SettingsSection title={COPY.SETTINGS_HELP}>
      <p className="px-6 py-6 text-sm text-wa-text-muted">
        Help centre, contact information and the privacy policy will appear
        here.
      </p>
    </SettingsSection>
  );
}
