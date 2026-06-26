import { Suspense } from "react";
import { StatusComposer } from "@/features/status/status-composer/status-composer";

export default function StatusNewPage() {
  return (
    <Suspense fallback={null}>
      <StatusComposer />
    </Suspense>
  );
}
