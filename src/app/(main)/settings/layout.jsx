import { SplitPane } from "@/features/layout/split-pane/split-pane";
import { SettingsList } from "@/features/settings/settings-list/settings-list";

export default function SettingsLayout({ children }) {
  return <SplitPane list={<SettingsList />}>{children}</SplitPane>;
}
