"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ShieldAlert, Sparkles, BookOpen, UserCheck, KeyRound, Clock, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DemoPage() {
  const [activeScenario, setActiveScenario] = useState<"evelyn" | "alex" | null>(null);

  return (
    <div className="section-shell py-14">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-5xl space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="section-kicker">Interactive walkthrough</div>
          <h1 className="font-display text-5xl text-white md:text-7xl">
            AfterLife Demo Center
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-white/68">
            Experience how AfterLife uses GenLayer Intelligent Contracts to solve real-world estate management and security challenges.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scenario A Card */}
          <Card className={`space-y-6 border-2 transition-all ${activeScenario === "evelyn" ? "border-gold/60 bg-gold/5" : "border-white/5"}`}>
            <div className="flex items-center gap-3 text-gold">
              <BookOpen className="h-5 w-5" />
              <div className="section-kicker">Scenario 1</div>
            </div>
            <CardTitle>The Legacy of Evelyn</CardTitle>
            <CardDescription className="leading-7">
              Follow a complete will execution lifecycle. An elderly grandmother secures her will and private memories for her grandchildren, which are later unsealed via AI verification.
            </CardDescription>

            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gold" />
                <span>Personas: Evelyn (Creator) & Liam (Grandchild)</span>
              </div>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-gold" />
                <span>Features: ECIES Message Encryption & AI Consensus</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                <span>Grace Period: 14-day reversible countdown</span>
              </div>
            </div>

            <Button
              onClick={() => setActiveScenario("evelyn")}
              className="w-full gap-2"
              variant={activeScenario === "evelyn" ? "default" : "secondary"}
            >
              <Play className="h-4 w-4" />
              Start Scenario 1
            </Button>
          </Card>

          {/* Scenario B Card */}
          <Card className={`space-y-6 border-2 transition-all ${activeScenario === "alex" ? "border-gold/60 bg-gold/5" : "border-white/5"}`}>
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              <div className="section-kicker">Scenario 2</div>
            </div>
            <CardTitle>The Protected Founder</CardTitle>
            <CardDescription className="leading-7">
              Demonstrate fraud protection. A tech founder's estate is targeted by a malicious claim using a fake obituary, which is caught and penalized by AI validators.
            </CardDescription>

            <div className="space-y-3 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-rose-400" />
                <span>Personas: Alex (Founder) & Mallory (Attacker)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>Features: Fraud Slash Penalty & Multi-LLM Review</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" />
                <span>Result: Active Will protected, fee forfeited</span>
              </div>
            </div>

            <Button
              onClick={() => setActiveScenario("alex")}
              className="w-full gap-2"
              variant={activeScenario === "alex" ? "default" : "secondary"}
            >
              <Play className="h-4 w-4" />
              Start Scenario 2
            </Button>
          </Card>
        </div>

        {/* Evelyn Walkthrough details */}
        {activeScenario === "evelyn" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-gold/20 bg-white/5 p-8 space-y-6"
          >
            <div className="section-kicker text-gold">Scenario 1 Walkthrough Guide</div>
            <h3 className="font-display text-3xl text-white">E2E Legacy & Message Delivery Flow</h3>
            <p className="text-white/70 leading-7">
              Follow these interactive steps to experience the complete legacy transfer process:
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 space-y-3">
                <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-display text-lg">1</div>
                <h4 className="font-display text-xl text-white">Register & Create</h4>
                <p className="text-xs text-white/50 leading-5">
                  Go to <Link href="/register-key" className="text-gold underline">Register Key</Link> as a beneficiary. Then go to <Link href="/create-will" className="text-gold underline">Create Will</Link> to write ECIES-encrypted letters for them.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 space-y-3">
                <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-display text-lg">2</div>
                <h4 className="font-display text-xl text-white">Consensus Verdict</h4>
                <p className="text-xs text-white/50 leading-5">
                  Go to <Link href="/verify-death" className="text-gold underline">Verify Death</Link>, select your will, and submit a memorial link. Watch AI reach consensus `CONFIRMED_DEAD`.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 space-y-3">
                <div className="h-8 w-8 rounded-full bg-gold/10 text-gold flex items-center justify-center font-display text-lg">3</div>
                <h4 className="font-display text-xl text-white">Grace & Release</h4>
                <p className="text-xs text-white/50 leading-5">
                  The grace countdown begins. Once it finishes, execute the will. The assets and ECIES messages are decrypted client-side!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alex Walkthrough details */}
        {activeScenario === "alex" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-gold/20 bg-white/5 p-8 space-y-6"
          >
            <div className="section-kicker text-rose-400">Scenario 2 Walkthrough Guide</div>
            <h3 className="font-display text-3xl text-white">Fraud Prevention & Slashed Stake</h3>
            <p className="text-white/70 leading-7">
              Follow these steps to witness the contract's defensive mechanism:
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 space-y-3">
                <div className="h-8 w-8 rounded-full bg-rose-400/10 text-rose-400 flex items-center justify-center font-display text-lg">1</div>
                <h4 className="font-display text-xl text-white">Active Guardian</h4>
                <p className="text-xs text-white/50 leading-5">
                  Alex's will is marked as ACTIVE. Alex checks in periodically to maintain presence.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 space-y-3">
                <div className="h-8 w-8 rounded-full bg-rose-400/10 text-rose-400 flex items-center justify-center font-display text-lg">2</div>
                <h4 className="font-display text-xl text-white">Fake Claim</h4>
                <p className="text-xs text-white/50 leading-5">
                  Mallory tries to claim Alex's death early by submitting a fabricated obituary URL.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 space-y-3">
                <div className="h-8 w-8 rounded-full bg-rose-400/10 text-rose-400 flex items-center justify-center font-display text-lg">3</div>
                <h4 className="font-display text-xl text-white">Slashing Triggered</h4>
                <p className="text-xs text-white/50 leading-5">
                  Validators compare evidence, detect the fraud attempt, output `FRAUD_DETECTED`, and Mallory's staked verification fee is slashed. Alex's will stays active.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
