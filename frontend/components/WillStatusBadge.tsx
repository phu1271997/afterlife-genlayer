import { cn } from "@/lib/utils";
import type { WillStatus } from "@/lib/mockWills";

const toneMap: Record<WillStatus, string> = {
  ACTIVE: "border-active/35 bg-active/15 text-lime-200",
  GRACE_PERIOD: "border-grace/35 bg-grace/15 text-amber-100",
  EXECUTED: "border-gold/35 bg-gold/15 text-gold",
  FRAUD_DETECTED: "border-alert/35 bg-alert/20 text-rose-100",
};

export function WillStatusBadge({ status }: { status: WillStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.28em]",
        toneMap[status],
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
