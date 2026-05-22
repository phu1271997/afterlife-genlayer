"use client";

import { useEffect, useState } from "react";
import { Download, Mail } from "lucide-react";

import { FinalMessageEnvelope } from "@/components/FinalMessageEnvelope";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAfterLifeStore } from "@/lib/store";

export default function MessagesPage({
  params,
}: {
  params: { will_id: string };
}) {
  const wills = useAfterLifeStore((state) => state.wills);
  const openMessage = useAfterLifeStore((state) => state.openMessage);
  const loadWillById = useAfterLifeStore((state) => state.loadWillById);
  const isConnected = useAfterLifeStore((state) => state.isConnected);
  const [error, setError] = useState<string | null>(null);
  const will = wills.find((entry) => entry.id === params.will_id);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    loadWillById(params.will_id).catch((nextError) => {
      setError(nextError instanceof Error ? nextError.message : "Unable to load message vault.");
    });
  }, [isConnected, loadWillById, params.will_id]);

  if (!will) {
    return (
      <div className="section-shell py-16">
        <Card>
          <CardTitle>Message vault not found</CardTitle>
          <CardDescription className="mt-3">No will was found for this route.</CardDescription>
        </Card>
      </div>
    );
  }

  const unlocked = will.status === "EXECUTED";

  return (
    <div className="section-shell py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="section-kicker">Final messages</div>
            <h1 className="mt-3 font-display text-6xl text-white">Letters kept for the right hour.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">
              AfterLife treats each message as an heirloom. Nothing opens early. Nothing is revealed lightly.
            </p>
          </div>
          <Button variant="secondary" className="gap-2">
            <Download className="h-4 w-4" />
            Download keepsake PDF
          </Button>
        </div>

        {error ? (
          <div className="rounded-[1.5rem] border border-alert/35 bg-alert/15 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-gold">
            <Mail className="h-5 w-5" />
            <div className="section-kicker">Vault status</div>
          </div>
          <CardTitle>{unlocked ? "The seals have been broken." : "The envelopes remain sealed."}</CardTitle>
          <CardDescription className="leading-7">
            {unlocked
              ? "The will has been executed and the final archive is now available to beneficiaries."
              : "The associated will has not yet executed, so message contents remain respectfully hidden."}
          </CardDescription>
        </Card>

        <div className="space-y-5">
          {will.finalMessages.length > 0 ? will.finalMessages.map((message) => (
            <FinalMessageEnvelope
              key={message.id}
              message={message}
              unlocked={unlocked}
              onOpen={
                unlocked
                  ? () => openMessage(will.id, message.id)
                  : undefined
              }
            />
          )) : (
            <Card className="space-y-3">
              <CardTitle>No cached message envelopes yet</CardTitle>
              <CardDescription className="leading-7">
                The deployed contract can reveal message contents when you know their on-chain message IDs. This frontend
                automatically shows messages that were created through this app session.
              </CardDescription>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
