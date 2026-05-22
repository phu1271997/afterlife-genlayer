"use client";

import { formatCountdown, formatDate } from "@/lib/utils";

export function GraceCountdown({ target }: { target: string }) {
  return (
    <div className="rounded-[1.75rem] border border-grace/30 bg-grace/10 p-5">
      <div className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
        Grace period
      </div>
      <div className="mt-2 font-display text-3xl text-amber-100">
        {formatCountdown(target)}
      </div>
      <div className="mt-2 text-sm text-amber-50/70">
        Reversible until {formatDate(target)}. If the owner returns, execution stops.
      </div>
    </div>
  );
}
