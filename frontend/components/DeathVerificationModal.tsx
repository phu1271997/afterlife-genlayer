"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VerificationRecord, VerificationVerdict, WillStatus } from "@/lib/mockWills";

interface Result extends VerificationRecord {
  willStatus: WillStatus;
}

const stages = [
  {
    key: "obituary",
    title: "Reading the obituary",
    detail: "Submitted memorial text is being parsed for name, age, and city alignment.",
  },
  {
    key: "sources",
    title: "Cross-referencing legitimate sources",
    detail: "Legacy memorials, local registries, and funeral notices are being compared.",
  },
  {
    key: "social",
    title: "Examining social memorial activity",
    detail: "Quiet signals across social profiles are being checked for remembrance patterns.",
  },
  {
    key: "consensus",
    title: "AI validators reaching consensus",
    detail: "Independent model judgments are converging on the safest interpretation.",
  },
  {
    key: "verdict",
    title: "Verdict prepared",
    detail: "AfterLife is ready to reveal the current finding with evidence and caution.",
  },
];

const verdictStyles: Record<
  VerificationVerdict,
  { title: string; tone: string; candleTone: string }
> = {
  CONFIRMED_DEAD: {
    title: "Verification confirmed. The grace period begins.",
    tone: "border-gold/35 bg-gold/10 text-gold",
    candleTone: "opacity-35",
  },
  ALIVE: {
    title: "The owner appears to still be with us.",
    tone: "border-active/35 bg-active/15 text-lime-100",
    candleTone: "opacity-100",
  },
  INCONCLUSIVE: {
    title: "Evidence remains incomplete.",
    tone: "border-grace/35 bg-grace/15 text-amber-100",
    candleTone: "opacity-75",
  },
  FRAUD_DETECTED: {
    title: "Fraudulent attempt detected.",
    tone: "border-alert/40 bg-alert/25 text-rose-100",
    candleTone: "opacity-100 saturate-[1.5]",
  },
};

export function DeathVerificationModal({
  isOpen,
  willTitle,
  obituaryUrl,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  willTitle: string;
  obituaryUrl: string;
  onClose: () => void;
  onComplete: () => Result;
}) {
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStageIndex(0);
      setResult(null);
      return;
    }

    const timers = stages.map((_, index) =>
      window.setTimeout(() => {
        setStageIndex(index);
        if (index === stages.length - 1) {
          setResult(onComplete());
        }
      }, index * 1600),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isOpen, onComplete]);

  const activeStage = useMemo(() => stages[stageIndex] ?? stages[0], [stageIndex]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070dbf] px-4 py-10 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="w-full max-w-4xl"
          >
            <Card className="relative overflow-hidden border-gold/20 p-0">
              <button
                onClick={onClose}
                className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-black/20 p-2 text-white/70 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(212,165,116,0.12),transparent_36%),rgba(255,255,255,0.04)] p-8 lg:border-b-0 lg:border-r">
                  <div className={`mx-auto candle mt-6 ${result ? verdictStyles[result.status].candleTone : ""}`} />
                  <div className="mt-8 text-center">
                    <div className="section-kicker">Solemn process</div>
                    <h3 className="mt-3 font-display text-4xl text-white">
                      AI Verification
                    </h3>
                    <p className="mt-3 text-sm text-white/65">
                      {willTitle} is being reviewed with patience, caution, and multiple sources.
                    </p>
                  </div>
                </div>

                <div className="p-8">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                    <div className="text-xs uppercase tracking-[0.32em] text-white/40">
                      Submitted obituary
                    </div>
                    <div className="mt-3 text-sm text-white/75">{obituaryUrl}</div>
                  </div>

                  <div className="mt-8 space-y-4">
                    {stages.map((stage, index) => (
                      <motion.div
                        key={stage.key}
                        initial={{ opacity: 0.4, x: 0 }}
                        animate={{
                          opacity: index <= stageIndex ? 1 : 0.35,
                          x: index === stageIndex ? 8 : 0,
                        }}
                        className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold">
                            {index < stageIndex || result ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-display text-2xl text-white">{stage.title}</div>
                            <div className="text-sm text-white/55">{stage.detail}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                    <div className="section-kicker">Current focus</div>
                    <div className="mt-3 font-display text-3xl text-white">
                      {activeStage.title}
                    </div>
                    <p className="mt-2 text-sm text-white/60">{activeStage.detail}</p>
                  </div>

                  {result ? (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-5"
                    >
                      <div className={`rounded-[1.75rem] border p-6 ${verdictStyles[result.status].tone}`}>
                        <div className="flex items-center gap-3">
                          {result.status === "FRAUD_DETECTED" ? (
                            <ShieldAlert className="h-5 w-5" />
                          ) : (
                            <ShieldCheck className="h-5 w-5" />
                          )}
                          <div className="font-display text-3xl">
                            {verdictStyles[result.status].title}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-current/85">
                          {result.reasoning}
                        </p>
                        <div className="mt-4 text-xs uppercase tracking-[0.28em] text-current/70">
                          Confidence {result.confidence}%
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                          <div className="section-kicker">Evidence</div>
                          <div className="mt-4 space-y-3 text-sm text-white/75">
                            {result.evidence.map((item) => (
                              <p key={item}>• {item}</p>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                          <div className="section-kicker">Red flags</div>
                          <div className="mt-4 space-y-3 text-sm text-white/75">
                            {result.redFlags.length > 0 ? (
                              result.redFlags.map((item) => <p key={item}>• {item}</p>)
                            ) : (
                              <p>No material red flags were surfaced in this run.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={onClose}>Return to will</Button>
                        <Button variant="secondary" onClick={onClose}>
                          Close solemnly
                        </Button>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
