"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Feather, Plus, ScrollText } from "lucide-react";

import { AssetAllocation } from "@/components/AssetAllocation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { Beneficiary, DigitalAsset } from "@/lib/mockWills";
import { useAfterLifeStore } from "@/lib/store";
import {
  readRecipientPublicKey,
  registerRecipientPublicKeyOnChain,
} from "@/lib/afterlife-contract";
import { getOrCreateECDHKeypair } from "@/lib/encryption";
import { addressEquals } from "@/lib/address";

const steps = [
  "Identity",
  "Check-in cadence",
  "Beneficiaries",
  "Digital assets",
  "Final messages",
  "Social links",
  "Review & sign",
];

const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const CREATION_FEE = 10;

export default function CreateWillPage() {
  const router = useRouter();
  const createWill = useAfterLifeStore((state) => state.createWill);
  const isConnected = useAfterLifeStore((state) => state.isConnected);
  const userAddress = useAfterLifeStore((state) => state.userAddress);
  const balance = useAfterLifeStore((state) => state.balance);
  const balanceLoaded = useAfterLifeStore((state) => state.balanceLoaded);

  const [step, setStep] = useState(0);
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState({
    ownerName: "",
    ownerBirthYear: 1988,
    ownerCity: "",
  });
  const [cadenceDays, setCadenceDays] = useState(60);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    {
      id: "draft-1",
      name: "Sarah Mercer",
      relationship: "Daughter",
      address: "0x3af9d4e70000000000000000000000000000b001",
      share: 100,
    },
  ]);
  const [assets, setAssets] = useState<DigitalAsset[]>([
    {
      id: "asset-draft-1",
      type: "ETH",
      label: "Long-term ETH reserve",
      description: "Funds intended to support family continuity.",
      amount: "4.2 ETH",
    },
  ]);
  const [messages, setMessages] = useState([
    {
      recipientAddress: "0x3af9d4e70000000000000000000000000000b001",
      recipientName: "Sarah Mercer",
      title: "For Sarah, when I can no longer say this aloud",
      body: "Live with gentleness and then with courage. The right order matters.",
      mediaUrl: "",
    },
  ]);
  const [socialLinks, setSocialLinks] = useState<string[]>(["https://x.com/"]);

  useEffect(() => {
    if (isConnected && userAddress) {
      setBeneficiaries((prev) =>
        prev.map((b) =>
          b.address.toLowerCase() === "0x3af9d4e70000000000000000000000000000b001"
            ? { ...b, address: userAddress, name: b.name === "Sarah Mercer" ? `${b.name} (You)` : b.name }
            : b
        )
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.recipientAddress.toLowerCase() === "0x3af9d4e70000000000000000000000000000b001"
            ? { ...m, recipientAddress: userAddress, recipientName: m.recipientName === "Sarah Mercer" ? `${m.recipientName} (You)` : m.recipientName }
            : m
        )
      );
    }
  }, [isConnected, userAddress]);

  const totalShare = useMemo(
    () => beneficiaries.reduce((sum, beneficiary) => sum + Number(beneficiary.share || 0), 0),
    [beneficiaries],
  );

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return Boolean(
        identity.ownerName.trim() &&
          identity.ownerCity.trim() &&
          Number.isInteger(identity.ownerBirthYear) &&
          identity.ownerBirthYear >= 1900 &&
          identity.ownerBirthYear <= 2026,
      );
    }
    if (step === 2) {
      if (beneficiaries.length === 0 || totalShare !== 100) return false;
      return beneficiaries.every(
        (beneficiary) =>
          beneficiary.name.trim() && HEX_ADDRESS.test(beneficiary.address.trim()),
      );
    }
    return true;
  }, [
    beneficiaries,
    identity.ownerBirthYear,
    identity.ownerCity,
    identity.ownerName,
    step,
    totalShare,
  ]);

  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  const validate = (): string | null => {
    if (!identity.ownerName.trim()) return "Owner full name is required.";
    if (!identity.ownerCity.trim()) return "Owner city is required.";
    if (
      !Number.isInteger(identity.ownerBirthYear) ||
      identity.ownerBirthYear < 1900 ||
      identity.ownerBirthYear > 2026
    ) {
      return "Owner birth year must be between 1900 and 2026.";
    }
    if (![30, 60, 90].includes(cadenceDays)) {
      return "Check-in cadence must be 30, 60, or 90 days.";
    }
    if (beneficiaries.length === 0) {
      return "Add at least one beneficiary.";
    }
    for (const beneficiary of beneficiaries) {
      if (!beneficiary.name.trim()) return "Every beneficiary needs a name.";
      if (!HEX_ADDRESS.test(beneficiary.address.trim())) {
        return `Beneficiary ${beneficiary.name || beneficiary.address} has an invalid wallet address.`;
      }
    }
    if (totalShare !== 100) {
      return `Beneficiary shares must total 100. Currently ${totalShare}.`;
    }
    for (const message of messages) {
      if (!HEX_ADDRESS.test((message.recipientAddress ?? "").trim())) {
        return `Final message recipient address is invalid: ${message.recipientAddress}`;
      }
      if (!message.body.trim()) {
        return "Final messages cannot be empty.";
      }
    }
    if (isConnected && balanceLoaded && balance < CREATION_FEE) {
      return `You need at least ${CREATION_FEE} LIFE to seal a will. Current balance: ${balance}.`;
    }
    return null;
  };

  const handleSeal = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setIsSealing(true);
      setError(null);

      let effectiveMessages = messages;
      if (isConnected && messages.length > 0) {
        const unique = Array.from(
          new Set(messages.map((m) => m.recipientAddress.trim().toLowerCase())),
        );
        const unregisteredExternal: string[] = [];
        for (const recipient of unique) {
          const pubKey = await readRecipientPublicKey(recipient);
          if (pubKey && pubKey.trim() !== "") continue;

          // Auto-register the connected wallet's own key so a first-time user
          // can seal a self-addressed message without a manual detour to
          // /register-key. External recipients still need to register from
          // their own browser — we cannot sign a tx on their behalf.
          if (addressEquals(recipient, userAddress)) {
            const { publicKeyHex } = await getOrCreateECDHKeypair(userAddress);
            if (!publicKeyHex) {
              setError(
                "Could not generate an encryption key in this browser. Try a different browser or unblock crypto.subtle.",
              );
              setIsSealing(false);
              return;
            }
            await registerRecipientPublicKeyOnChain(publicKeyHex);
          } else {
            unregisteredExternal.push(recipient);
          }
        }

        if (unregisteredExternal.length > 0) {
          // Drop messages for recipients we cannot auto-register so the will
          // still gets created. Notify the user so they can follow up.
          const dropped = new Set(unregisteredExternal);
          effectiveMessages = messages.filter(
            (m) => !dropped.has(m.recipientAddress.trim().toLowerCase()),
          );
          setError(
            `Skipped sealed messages for unregistered recipients: ${unregisteredExternal.join(
              ", ",
            )}. Ask them to register a key at /register-key, then add the messages later.`,
          );
        }
      }

      const willId = await createWill({
        ownerName: identity.ownerName.trim(),
        ownerBirthYear: identity.ownerBirthYear,
        ownerCity: identity.ownerCity.trim(),
        cadenceDays,
        beneficiaries: beneficiaries.map((beneficiary) => ({
          ...beneficiary,
          address: beneficiary.address.trim().toLowerCase(),
          name: beneficiary.name.trim(),
        })),
        assets,
        finalMessages: effectiveMessages.map((message) => ({
          ...message,
          recipientAddress: message.recipientAddress.trim().toLowerCase(),
        })),
        socialLinks: socialLinks.filter(Boolean),
      });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push(`/my-will?created=${willId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create will.");
    } finally {
      setIsSealing(false);
    }
  };

  return (
    <div className="section-shell py-14">
      <div className="mx-auto max-w-5xl">
        <div className="section-kicker">Create your digital will</div>
        <h1 className="mt-4 font-display text-6xl text-white">A deliberate document for the people you love.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">
          Each step is designed to feel more like estate planning than onboarding. Move slowly. The protocol will.
        </p>
        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/65">
          {isConnected
            ? "Wallet connected: this flow will write directly to your deployed GenLayer contract."
            : "Demo mode is still available, but connect your wallet first if you want this will written on-chain."}
        </div>

        <div className="mt-10 glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-[0.32em] text-white/40">
                Step {step + 1} of {steps.length}
              </div>
              <div className="font-display text-3xl text-white">{steps[step]}</div>
            </div>
            <div className="text-sm text-white/55">{Math.round(((step + 1) / steps.length) * 100)}% complete</div>
          </div>
          <Progress className="mt-5" value={((step + 1) / steps.length) * 100} />
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
            {steps.map((label, index) => (
              <span
                key={label}
                className={index === step ? "text-gold" : index < step ? "text-white/70" : ""}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="glass-card p-8">
            {step === 0 ? (
              <div className="space-y-6">
                <div>
                  <CardTitle>Identity for future verification</CardTitle>
                  <CardDescription className="mt-2">
                    These details help GenLayer validators match legitimate obituaries and memorial records with care.
                  </CardDescription>
                </div>
                <Input
                  placeholder="Full legal name"
                  value={identity.ownerName}
                  onChange={(event) =>
                    setIdentity((current) => ({ ...current, ownerName: event.target.value }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Birth year"
                    value={identity.ownerBirthYear}
                    onChange={(event) =>
                      setIdentity((current) => ({
                        ...current,
                        ownerBirthYear: Number(event.target.value),
                      }))
                    }
                  />
                  <Input
                    placeholder="City of residence"
                    value={identity.ownerCity}
                    onChange={(event) =>
                      setIdentity((current) => ({ ...current, ownerCity: event.target.value }))
                    }
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <CardTitle>Choose your proof-of-life cadence</CardTitle>
                  <CardDescription className="mt-2">
                    Missing three consecutive check-ins triggers AI death verification.
                  </CardDescription>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[30, 60, 90].map((value) => (
                    <button
                      key={value}
                      onClick={() => setCadenceDays(value)}
                      className={`rounded-[1.75rem] border p-6 text-left transition ${
                        cadenceDays === value
                          ? "border-gold bg-gold/10"
                          : "border-white/10 bg-white/5 hover:bg-white/8"
                      }`}
                    >
                      <div className="font-display text-4xl text-white">{value}</div>
                      <div className="mt-2 text-sm text-white/60">days between gentle check-ins</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <CardTitle>Designate beneficiaries</CardTitle>
                    <CardDescription className="mt-2">
                      Shares must total exactly 100%. The pie adjusts as you write.
                    </CardDescription>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setBeneficiaries((current) => [
                        ...current,
                        {
                          id: `draft-${current.length + 1}`,
                          name: "",
                          relationship: "Heir",
                          address: "",
                          share: 0,
                        },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add beneficiary
                  </Button>
                </div>
                <div className="space-y-4">
                  {beneficiaries.map((beneficiary, index) => (
                    <div
                      key={beneficiary.id}
                      className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-black/10 p-4 md:grid-cols-4"
                    >
                      <Input
                        placeholder="Name"
                        value={beneficiary.name}
                        onChange={(event) =>
                          setBeneficiaries((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="Relationship"
                        value={beneficiary.relationship}
                        onChange={(event) =>
                          setBeneficiaries((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, relationship: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="Ethereum address"
                        value={beneficiary.address}
                        onChange={(event) =>
                          setBeneficiaries((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, address: event.target.value } : item,
                            ),
                          )
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Share %"
                        value={beneficiary.share}
                        onChange={(event) =>
                          setBeneficiaries((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, share: Number(event.target.value) }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  Current total: <span className={totalShare === 100 ? "text-lime-200" : "text-amber-100"}>{totalShare}%</span>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <CardTitle>Describe the digital assets</CardTitle>
                    <CardDescription className="mt-2">
                      For the demo, assets are descriptive rather than escrowed. The point is clarity.
                    </CardDescription>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setAssets((current) => [
                        ...current,
                        {
                          id: `asset-draft-${current.length + 1}`,
                          type: "NFT",
                          label: "",
                          description: "",
                          amount: "",
                        },
                      ])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add asset
                  </Button>
                </div>
                <div className="space-y-4">
                  {assets.map((asset, index) => (
                    <div key={asset.id} className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="Asset type"
                          value={asset.type}
                          onChange={(event) =>
                            setAssets((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, type: event.target.value } : item,
                              ),
                            )
                          }
                        />
                        <Input
                          placeholder="Label"
                          value={asset.label}
                          onChange={(event) =>
                            setAssets((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, label: event.target.value } : item,
                              ),
                            )
                          }
                        />
                        <Input
                          placeholder="Amount"
                          value={asset.amount}
                          onChange={(event) =>
                            setAssets((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, amount: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <Textarea
                        placeholder="Description"
                        value={asset.description}
                        onChange={(event) =>
                          setAssets((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <div>
                  <CardTitle>Seal final messages</CardTitle>
                  <CardDescription className="mt-2 text-white/60">
                    Messages are encrypted client-side (ENC:v2) with the recipient&apos;s on-chain public key.
                    Each recipient must register a key at{" "}
                    <a href="/register-key" className="text-gold underline">/register-key</a> first —
                    plaintext is rejected by the contract.
                  </CardDescription>
                  <CardDescription className="mt-2">
                    Optional, but often the most meaningful part of the will.
                  </CardDescription>
                </div>
                {messages.map((message, index) => (
                  <div key={`${message.recipientName}-${index}`} className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Recipient name"
                        value={message.recipientName}
                        onChange={(event) =>
                          setMessages((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, recipientName: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="Recipient address"
                        value={message.recipientAddress}
                        onChange={(event) =>
                          setMessages((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, recipientAddress: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <Input
                      className="mt-3"
                      placeholder="Message title"
                      value={message.title}
                      onChange={(event) =>
                        setMessages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Textarea
                      className="mt-3"
                      placeholder="Your final message"
                      value={message.body}
                      onChange={(event) =>
                        setMessages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, body: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Input
                      className="mt-3"
                      placeholder="Optional photo or video URL"
                      value={message.mediaUrl}
                      onChange={(event) =>
                        setMessages((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, mediaUrl: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <CardTitle>Add social verification links</CardTitle>
                    <CardDescription className="mt-2">
                      Used by AI to cross-reference memorial posts, silence patterns, and account states.
                    </CardDescription>
                  </div>
                  <Button variant="secondary" onClick={() => setSocialLinks((current) => [...current, ""])}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add link
                  </Button>
                </div>
                <div className="space-y-3">
                  {socialLinks.map((link, index) => (
                    <Input
                      key={`${link}-${index}`}
                      placeholder="https://twitter.com/..."
                      value={link}
                      onChange={(event) =>
                        setSocialLinks((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-6">
                <div>
                  <CardTitle>Review and sign</CardTitle>
                  <CardDescription className="mt-2">
                    This final review is styled like a quiet estate document. When you seal it, 10 LIFE tokens are
                    staked for creation.
                  </CardDescription>
                </div>
                <div className="document-card space-y-5 p-8">
                  <div className="flex items-center gap-3">
                    <ScrollText className="h-5 w-5 text-stone-700" />
                    <div className="font-display text-3xl text-stone-900">AfterLife Digital Will</div>
                  </div>
                  <p className="text-stone-700">
                    I, {identity.ownerName || "the undersigned"}, residing in {identity.ownerCity || "my city"},
                    affirm that this protocol should preserve my digital intent with a {cadenceDays}-day proof-of-life cadence.
                  </p>
                  <p className="text-stone-700">
                    By creating this will, I consent to respectful AI verification after missed check-ins, a reversible
                    14-day grace period, and eventual release of the allocations and messages described herein.
                  </p>
                  <div className="rounded-[1.5rem] border border-stone-300 bg-white/50 p-4 text-sm text-stone-700">
                    Beneficiaries: {beneficiaries.map((beneficiary) => beneficiary.name).join(", ")}
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-[1.5rem] border border-alert/35 bg-alert/15 p-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {step === steps.length - 1 && isConnected && balanceLoaded && balance < CREATION_FEE ? (
              <div className="mt-6 rounded-[1.5rem] border border-alert/35 bg-alert/15 p-4 text-sm text-rose-100">
                You need at least {CREATION_FEE} LIFE to seal a will. Current balance: {balance}. Claim starter tokens from the header first.
              </div>
            ) : null}

            <div className="mt-8 flex justify-between gap-4">
              <Button variant="secondary" onClick={back} disabled={step === 0 || isSealing}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={next} disabled={!canAdvance}>
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSeal}
                  disabled={
                    isSealing ||
                    (isConnected && balanceLoaded && balance < CREATION_FEE)
                  }
                >
                  {isSealing ? (
                    <>
                      <Feather className="mr-2 h-4 w-4 animate-pulse" />
                      Sealing your will...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Stake 10 LIFE tokens to immortalize
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="section-kicker">Live review</div>
              <CardTitle className="mt-3">Inheritance allocation</CardTitle>
              <CardDescription className="mt-2">
                The distribution updates in real time as you revise shares.
              </CardDescription>
              <div className="mt-6">
                <AssetAllocation beneficiaries={beneficiaries} />
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-[#7f1d1d] text-gold shadow-candle">
                  <Feather className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Wax seal moment</CardTitle>
                  <CardDescription className="mt-1">
                    Each message is treated like a sealed envelope awaiting the right time.
                  </CardDescription>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
