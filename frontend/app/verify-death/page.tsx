"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, BookHeart } from "lucide-react";

import { DeathVerificationModal } from "@/components/DeathVerificationModal";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAfterLifeStore } from "@/lib/store";

export default function VerifyDeathPage() {
  const wills = useAfterLifeStore((state) => state.wills);
  const triggerVerification = useAfterLifeStore((state) => state.triggerVerification);

  const [willId, setWillId] = useState("AL-002");
  const [obituaryUrl, setObituaryUrl] = useState("https://legacy.example.com/john-mercer-obituary");
  const [confirmed, setConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof triggerVerification> | null>(null);

  const will = useMemo(() => wills.find((entry) => entry.id === willId), [willId, wills]);

  const handleComplete = useCallback(() => {
    const result = triggerVerification(willId, obituaryUrl);
    setSummary(result);
    return result;
  }, [obituaryUrl, triggerVerification, willId]);

  return (
    <div className="section-shell py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="section-kicker">Beneficiary verification</div>
          <h1 className="mt-3 font-display text-6xl text-white">This is a serious action.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">
            Proceed only with respect and certainty. AfterLife will read the obituary, cross-reference other sources,
            and choose the most conservative safe verdict.
          </p>
        </div>

        <Card className="space-y-6 p-8">
          <div className="flex items-start gap-4 rounded-[1.5rem] border border-gold/20 bg-gold/10 p-5 text-sm text-gold/90">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            A wrongful confirmation could harm a living person. This protocol is deliberately cautious and begins with a reversible grace period.
          </div>

          <div className="space-y-3">
            <label className="text-sm text-white/70">Will ID</label>
            <Input value={willId} onChange={(event) => setWillId(event.target.value)} placeholder="AL-002" />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-white/70">Claimed obituary URL</label>
            <Input
              value={obituaryUrl}
              onChange={(event) => setObituaryUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>

          {will ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
              <div className="section-kicker">Selected will</div>
              <div className="mt-3 font-display text-3xl text-white">{will.title}</div>
              <p className="mt-2 text-sm text-white/60">
                Owner: {will.ownerName}, {will.ownerCity}. Verification fee: 5 LIFE.
              </p>
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-black/10 p-5 text-sm text-white/70">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1"
            />
            I confirm I am acting in good faith, with reason to believe the owner has passed, and understand that
            fraudulent attempts may be penalized.
          </label>

          <Button size="lg" disabled={!confirmed || !willId || !obituaryUrl} onClick={() => setIsOpen(true)}>
            Begin AI Verification
          </Button>
        </Card>

        {summary ? (
          <Card className="space-y-4">
            <div className="flex items-center gap-3 text-gold">
              <BookHeart className="h-5 w-5" />
              <div className="section-kicker">Latest verdict</div>
            </div>
            <CardTitle>{summary.status.replace("_", " ")}</CardTitle>
            <CardDescription className="leading-7">{summary.reasoning}</CardDescription>
          </Card>
        ) : null}
      </div>

      <DeathVerificationModal
        isOpen={isOpen}
        willTitle={will?.title ?? "Unknown will"}
        obituaryUrl={obituaryUrl}
        onClose={() => setIsOpen(false)}
        onComplete={handleComplete}
      />
    </div>
  );
}
