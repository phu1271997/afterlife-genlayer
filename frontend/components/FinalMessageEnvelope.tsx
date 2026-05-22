"use client";

import { motion } from "framer-motion";
import { LockKeyhole, MailOpen, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FinalMessage } from "@/lib/mockWills";
import { formatDate } from "@/lib/utils";

export function FinalMessageEnvelope({
  message,
  unlocked,
  onOpen,
}: {
  message: FinalMessage;
  unlocked: boolean;
  onOpen?: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[2rem] border border-gold/20 bg-white/5 shadow-halo"
    >
      <div className="relative border-b border-white/8 p-6">
        <div className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-[#7f1d1d] text-gold shadow-candle">
          {unlocked ? <MailOpen className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        </div>
        <div className="max-w-[80%]">
          <div className="section-kicker">Final message</div>
          <h3 className="mt-3 font-display text-3xl text-white">{message.title}</h3>
          <p className="mt-2 text-sm text-white/55">
            Sealed on {formatDate(message.sealedAt)} for {message.recipientName}
          </p>
        </div>
      </div>

      {unlocked ? (
        <div className="parchment-panel space-y-4 p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.26em] text-stone-700">
            <Sparkles className="h-3.5 w-3.5" />
            Delivered {message.deliveredAt ? formatDate(message.deliveredAt) : "now"}
          </div>
          <p className="font-quote text-lg leading-8 text-stone-800">{message.body}</p>
          {message.mediaUrl ? (
            <a
              href={message.mediaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm text-stone-700 underline decoration-gold underline-offset-4"
            >
              View attached memory
            </a>
          ) : null}
        </div>
      ) : (
        <div className="p-6">
          <div className="flex flex-col gap-4 rounded-[1.75rem] border border-dashed border-gold/25 bg-gold/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-white/72">
                This letter remains under seal until the will is executed.
              </p>
              <p className="mt-2 text-sm text-white/45">
                AfterLife releases words only after the protocol has earned that moment.
              </p>
            </div>
            {onOpen ? (
              <Button variant="secondary" onClick={onOpen}>
                Preview envelope
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );
}
