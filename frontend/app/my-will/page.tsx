"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Clock3, ScrollText, Sparkles } from "lucide-react";

import { AssetAllocation } from "@/components/AssetAllocation";
import { BeneficiaryList } from "@/components/BeneficiaryList";
import { FinalMessageEnvelope } from "@/components/FinalMessageEnvelope";
import { GraceCountdown } from "@/components/GraceCountdown";
import { ProofOfLifeButton } from "@/components/ProofOfLifeButton";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WillCard } from "@/components/WillCard";
import { WillStatusBadge } from "@/components/WillStatusBadge";
import { useAfterLifeStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function MyWillPage() {
  const userAddress = useAfterLifeStore((state) => state.userAddress);
  const wills = useAfterLifeStore((state) => state.wills);
  const proofOfLife = useAfterLifeStore((state) => state.proofOfLife);

  const ownedWills = useMemo(
    () => wills.filter((will) => will.ownerAddress === userAddress),
    [userAddress, wills],
  );
  const currentWill = ownedWills[0] ?? wills[0];

  return (
    <div className="section-shell py-14">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="section-kicker">Owner dashboard</div>
            <h1 className="mt-3 font-display text-6xl text-white">Your will is active. You are remembered.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">
              AfterLife does not wait for catastrophe. It simply keeps a respectful record of your continued presence.
            </p>
          </div>
          <Link href="/create-will">
            <Button variant="secondary">Create another will</Button>
          </Link>
        </div>

        <ProofOfLifeButton
          lastCheckIn={currentWill.lastCheckIn}
          nextCheckIn={currentWill.nextCheckIn}
          onCheckIn={() => proofOfLife(currentWill.id)}
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="section-kicker">Current will</div>
                <CardTitle className="mt-3">{currentWill.title}</CardTitle>
                <CardDescription className="mt-2">
                  Created on {formatDate(currentWill.createdAt)} for {currentWill.ownerName}.
                </CardDescription>
              </div>
              <WillStatusBadge status={currentWill.status} />
            </div>
            <AssetAllocation beneficiaries={currentWill.beneficiaries} />
            {currentWill.graceEndsAt ? <GraceCountdown target={currentWill.graceEndsAt} /> : null}
          </Card>

          <Card className="space-y-5">
            <div className="section-kicker">Overview</div>
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center gap-3 text-sm text-white/55">
                  <Clock3 className="h-4 w-4 text-gold" />
                  Next proof-of-life requested
                </div>
                <div className="mt-2 font-display text-3xl text-white">{formatDate(currentWill.nextCheckIn)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center gap-3 text-sm text-white/55">
                  <ScrollText className="h-4 w-4 text-gold" />
                  Final messages sealed
                </div>
                <div className="mt-2 font-display text-3xl text-white">{currentWill.finalMessages.length}</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <BeneficiaryList beneficiaries={currentWill.beneficiaries} />

          <Card className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="section-kicker">Sealed messages</div>
                <CardTitle className="mt-3">Words kept for the right moment.</CardTitle>
              </div>
              <Link href={`/messages/${currentWill.id}`} className="text-sm text-gold underline decoration-gold underline-offset-4">
                Open message vault
              </Link>
            </div>
            <div className="space-y-4">
              {currentWill.finalMessages.slice(0, 2).map((message) => (
                <FinalMessageEnvelope
                  key={message.id}
                  message={message}
                  unlocked={currentWill.status === "EXECUTED"}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-4">
            <div className="section-kicker">Activity log</div>
            <CardTitle className="mt-3">Every step leaves a trace.</CardTitle>
            <div className="mt-4 space-y-4">
              {currentWill.activity.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-white/8 bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">{formatDate(item.date)}</div>
                  <div className="mt-2 font-display text-2xl text-white">{item.label}</div>
                  <div className="mt-2 text-sm leading-7 text-white/62">{item.detail}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-[2rem] border border-gold/20 bg-gold/10 p-5 text-sm text-gold/90">
              <Sparkles className="h-5 w-5" />
              Any proof-of-life check during a grace period immediately restores the will to ACTIVE.
            </div>
            {ownedWills.map((will) => (
              <WillCard key={will.id} will={will} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
