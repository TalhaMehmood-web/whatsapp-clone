"use client";

import { useUiStore } from "@/stores/ui-store";
import { ManageLabelsModal } from "./manage-labels-modal";

// Single mount point for the global "Labels" modal. Lives in the (main)
// layout so any tree below can call `openManageLabels()` without prop
// drilling.
export function ManageLabelsHost() {
  const open = useUiStore((s) => s.manageLabelsOpen);
  const close = useUiStore((s) => s.closeManageLabels);
  return <ManageLabelsModal open={open} onOpenChange={(v) => !v && close()} />;
}
