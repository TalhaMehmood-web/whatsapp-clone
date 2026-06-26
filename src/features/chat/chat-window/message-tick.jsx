import { Check, CheckCheck, Clock } from "lucide-react";
import { ReceiptStatus } from "@/models/enums";
import { cn } from "@/utils/cn";

// Tick mark next to outgoing message time:
//   PENDING   → clock (optimistic, still uploading / not server-acked)
//   SENT      → single grey check
//   DELIVERED → double grey check
//   READ      → double blue check
export function MessageTick({ status, className }) {
  if (status === ReceiptStatus.PENDING) {
    return <Clock className={cn("size-3.5 text-wa-text-muted", className)} />;
  }
  if (status === ReceiptStatus.SENT) {
    return <Check className={cn("size-3.5 text-wa-text-muted", className)} />;
  }
  if (status === ReceiptStatus.DELIVERED) {
    return <CheckCheck className={cn("size-3.5 text-wa-text-muted", className)} />;
  }
  if (status === ReceiptStatus.READ) {
    return <CheckCheck className={cn("size-3.5 text-wa-read-blue", className)} />;
  }
  return null;
}
