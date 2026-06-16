"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, HandCoins, ScrollText } from "lucide-react";

import { AssetAllocation } from "@/components/AssetAllocation";
import { GraceCountdown } from "@/components/GraceCountdown";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAfterLifeStore } from "@/lib/store";

export default function ClaimPage({
  params,
}: {
  params: { will_id: string };
}) {
  const wills = useAfterLifeStore((state) => state.wills);
  const executeWill = useAfterLifeStore((state) => state.executeWill);
  const loadWillById = useAfterLifeStore((state) => state.loadWillById);
  const isConnected = useAfterLifeStore((state) => state.isConnected);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const will = wills.find((entry) => entry.id === params.will_id);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    loadWillById(params.will_id).catch((nextError) => {
      setError(nextError instanceof Error ? nextError.message : "Unable to load will.");
    });
  }, [isConnected, loadWillById, params.will_id]);

  if (!will) {
    return (
      <div className="section-shell py-16">
        <Card>
          <CardTitle>Will not found</CardTitle>
          <CardDescription className="mt-3">This claim route does not match a known demo will.</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="section-shell py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="section-kicker">Claim inheritance</div>
          <h1 className="mt-3 font-display text-6xl text-white">It is time.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">
            AfterLife waits until the grace period is earned. Only then does the protocol permit execution.
          </p>
        </div>

        {error ? (
          <div className="rounded-[1.5rem] border border-alert/35 bg-alert/15 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-6">
            <div className="section-kicker">Will {will.id}</div>
            <CardTitle className="mt-3">{will.title}</CardTitle>
            <CardDescription className="mt-2 leading-7">
              This will belongs to {will.ownerName}. The current state is {will.status.replace("_", " ")}.
            </CardDescription>
            <AssetAllocation beneficiaries={will.beneficiaries} />
            {will.graceEndsAt ? <GraceCountdown target={will.graceEndsAt} will={will} /> : null}
          </Card>

          <Card className="space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold shadow-candle">
              <HandCoins className="h-6 w-6" />
            </div>
            <CardTitle>Your inheritance share</CardTitle>
            <CardDescription className="leading-7">
              The demo focuses on allocation clarity and message delivery. Asset transfer hooks can be connected to escrowed vaults later.
            </CardDescription>
            <div className="space-y-3">
              {will.assets.map((asset) => (
                <div key={asset.id} className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
                  <div className="font-display text-2xl text-white">{asset.label}</div>
                  <div className="mt-1 text-sm text-white/55">{asset.description}</div>
                  <div className="mt-3 text-gold">{asset.amount}</div>
                </div>
              ))}
            </div>

            {will.status !== "EXECUTED" ? (
              <Button
                size="lg"
                disabled={isExecuting}
                onClick={async () => {
                  try {
                    setError(null);
                    setIsExecuting(true);
                    await executeWill(will.id);
                  } catch (nextError) {
                    setError(nextError instanceof Error ? nextError.message : "Unable to execute will.");
                  } finally {
                    setIsExecuting(false);
                  }
                }}
              >
                Execute Will
              </Button>
            ) : (
              <Link href={`/messages/${will.id}`}>
                <Button size="lg" className="gap-2">
                  View final messages
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </Card>
        </div>

        {will.status === "EXECUTED" ? (
          <Card className="space-y-3">
            <div className="flex items-center gap-3 text-gold">
              <ScrollText className="h-5 w-5" />
              <div className="section-kicker">Execution complete</div>
            </div>
            <CardTitle>Your inheritance is sealed in eternity.</CardTitle>
            <CardDescription>
              Messages have been unsealed and the emotional archive is ready.
            </CardDescription>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
