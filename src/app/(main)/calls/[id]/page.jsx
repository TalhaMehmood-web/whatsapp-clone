"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { useCallQuery } from "@/tanstack/calls/queries";
import { CallScreen } from "@/features/calls/call-screen/call-screen";

export default function CallScreenPage({ params }) {
  const { id } = use(params);
  const { data, isLoading } = useCallQuery(id);

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white/70">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  return <CallScreen call={data} />;
}
