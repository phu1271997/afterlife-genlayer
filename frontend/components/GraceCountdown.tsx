"use client";

import { useEffect, useState } from "react";
import { formatCountdown, formatDate } from "@/lib/utils";
import type { WillRecord } from "@/lib/mockWills";
import { createReadClient } from "@/lib/genlayer";

export function GraceCountdown({ target, will }: { target: string; will?: WillRecord }) {
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const client = createReadClient();
    async function updateBlock() {
      try {
        const block = await client.getBlockNumber();
        if (active) {
          setCurrentBlock(Number(block));
        }
      } catch (err) {
        console.error("Failed to fetch block number:", err);
      }
    }

    updateBlock();
    const interval = setInterval(updateBlock, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate blocks remaining
  const graceStartedBlock = will?.gracePeriodStartedBlock ?? 0;
  const gracePeriodBlocks = will?.gracePeriodBlocks ?? 241920; // default 14 days

  let blockCountdownText = "";
  if (currentBlock && graceStartedBlock > 0) {
    const elapsed = currentBlock - graceStartedBlock;
    const remaining = Math.max(0, gracePeriodBlocks - elapsed);
    if (remaining > 0) {
      const seconds = remaining * 5; // ~5s block time
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      
      blockCountdownText = `${remaining.toLocaleString()} blocks remaining (~${days}d ${hours}h ${mins}m)`;
    } else {
      blockCountdownText = "Grace period completed. Execution allowed!";
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-grace/30 bg-grace/10 p-5 space-y-3">
      <div className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
        Grace period countdown
      </div>
      <div className="font-display text-3xl text-amber-100">
        {formatCountdown(target)}
      </div>
      {blockCountdownText && (
        <div className="font-mono text-xs text-gold/90 bg-black/25 rounded-lg p-2 border border-gold/10 inline-block">
          ⛓️ {blockCountdownText}
        </div>
      )}
      <div className="text-sm text-amber-50/70">
        Reversible until {formatDate(target)}. If the owner returns, execution stops.
      </div>
    </div>
  );
}
