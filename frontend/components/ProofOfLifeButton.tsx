"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export function ProofOfLifeButton({
  lastCheckIn,
  nextCheckIn,
  onCheckIn,
}: {
  lastCheckIn: string;
  nextCheckIn: string;
  onCheckIn: () => void | Promise<void>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(212,165,116,0.18),transparent_42%),rgba(255,255,255,0.05)] p-8 shadow-halo"
    >
      <div className="absolute -right-8 -top-6 h-28 w-28 rounded-full bg-spirit/15 blur-3xl" />
      <div className="absolute left-8 top-8 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 shadow-candle">
        <Flame className="h-6 w-6 animate-flicker text-gold" />
      </div>
      <div className="pl-24">
        <div className="section-kicker">Proof of life</div>
        <h2 className="mt-3 font-display text-4xl text-white md:text-5xl">
          You are still here.
        </h2>
        <p className="mt-3 max-w-2xl text-white/70">
          A quiet ritual to keep the protocol anchored to your living presence.
          Each confirmation resets the verification clock.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Last check-in</div>
            <div className="mt-2 font-display text-2xl text-white">
              {formatDate(lastCheckIn)}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Next requested</div>
            <div className="mt-2 font-display text-2xl text-white">
              {formatDate(nextCheckIn)}
            </div>
          </div>
        </div>
        <Button size="lg" onClick={onCheckIn} className="gap-3">
          <Sparkles className="h-5 w-5" />
          I'm Alive
        </Button>
      </div>
    </motion.div>
  );
}
