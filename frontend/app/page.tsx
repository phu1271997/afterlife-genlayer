"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Flame, Landmark, LockKeyhole, ShieldCheck, Stars } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WillCard } from "@/components/WillCard";
import { useAfterLifeStore } from "@/lib/store";

const quietCrisis = [
  {
    stat: "$140B",
    title: "Lost to crypto deaths",
    story:
      "Chainalysis estimates a vast share of Bitcoin may already be inaccessible because the owner passed without a plan.",
  },
  {
    stat: "$190M",
    title: "Frozen in QuadrigaCX",
    story:
      "Gerald Cotten's death left exchange access tangled in secrecy and grief, exposing how brittle digital inheritance remains.",
  },
  {
    stat: "70%",
    title: "Unprepared families",
    story:
      "Most crypto holders have not shared enough information for loved ones to recover digital wealth when life changes suddenly.",
  },
];

const transferItems = [
  "Crypto vaults",
  "NFT collections",
  "Domain names",
  "Cloud credentials",
  "Final letters",
  "Photos and videos",
  "Family stories",
];

export default function HomePage() {
  const wills = useAfterLifeStore((state) => state.wills);
  const featuredWill = wills[0];

  return (
    <div className="pb-24">
      <section className="section-shell relative overflow-hidden pt-16 md:pt-24">
        <div className="absolute left-0 top-10 h-64 w-64 rounded-full bg-spirit/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="section-kicker">AI-verified digital will protocol on GenLayer</div>
          <h1 className="mt-8 font-display text-6xl leading-[0.95] text-white md:text-8xl">
            Death is not the end.
            <span className="mt-3 block text-gold">It is the moment your legacy begins.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/70">
            AfterLife preserves assets, final messages, and family intent with dignity. When the time comes,
            AI validators on GenLayer verify the moment carefully, begin a reversible grace period, and only then
            unlock what was entrusted to loved ones.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ["$140B", "lost to crypto deaths"],
              ["$68T", "great wealth transfer underway"],
              [`${wills.length}`, "wills currently active in demo"],
            ].map(([value, label]) => (
              <div key={label} className="glass-card p-6 text-left">
                <div className="font-display text-4xl text-gold">{value}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.28em] text-white/45">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/create-will">
              <Button size="lg" className="gap-2">
                Create Your Will
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="secondary" className="gap-2">
                Learn How It Works
                <BookOpenText className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell mt-24">
        <div className="grid gap-6 md:grid-cols-3">
          {quietCrisis.map((item) => (
            <Card key={item.title} className="h-full">
              <div className="section-kicker">The quiet crisis</div>
              <CardTitle className="mt-4">{item.stat}</CardTitle>
              <div className="mt-2 font-display text-3xl text-white">{item.title}</div>
              <CardDescription className="mt-4 leading-7">{item.story}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell mt-24">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="section-kicker">How AfterLife works</div>
            <h2 className="section-title mt-3">A protocol for inevitability, built with patience.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/60">
            The system moves through creation, living proof, verification, and legacy release without needing a
            single trusted gatekeeper.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {[
            ["Create", "Compose your will, designate heirs, and seal final messages."],
            ["Live", "Periodic check-ins quietly prove that you remain present."],
            ["Verify", "AI validators cross-reference obituaries, memorials, and social signals."],
            ["Legacy", "After the grace period, assets distribute and messages are unsealed."],
          ].map(([title, body], index) => (
            <Card key={title} className="relative overflow-hidden">
              <div className="absolute right-4 top-4 font-display text-6xl text-white/5">{index + 1}</div>
              <div className="section-kicker">Step {index + 1}</div>
              <CardTitle className="mt-4">{title}</CardTitle>
              <CardDescription className="mt-3 leading-7">{body}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell mt-24 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-8">
          <div className="section-kicker">What you can pass down</div>
          <h2 className="mt-4 font-display text-5xl text-white">Not just assets. Meaning.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {transferItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-white/10 bg-black/10 px-5 py-4 text-white/75"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="document-card p-8">
          <div className="section-kicker text-stone-500">The philosophy</div>
          <blockquote className="mt-5 font-quote text-3xl leading-tight text-stone-900">
            “To live in hearts we leave behind is not to die.”
          </blockquote>
          <p className="mt-2 text-sm uppercase tracking-[0.28em] text-stone-500">Thomas Campbell</p>
          <p className="mt-8 text-base leading-8 text-stone-700">
            AfterLife treats estate planning as an act of care rather than a bureaucratic afterthought. The protocol
            exists for the people who will one day need clarity, tenderness, and access when grief is already heavy.
          </p>
          <Link href="/how-it-works" className="mt-8 inline-flex text-sm text-stone-800 underline decoration-gold underline-offset-4">
            Read the full philosophy and verification model
          </Link>
        </div>
      </section>

      <section className="section-shell mt-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="section-kicker">Trust and security</div>
            <h2 className="section-title mt-3">Reverence needs safeguards.</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, "AI consensus", "Multiple validators cross-check the same claim before any grace period begins."],
            [LockKeyhole, "Private messages", "Words remain sealed until the protocol has safely reached execution."],
            [Landmark, "14-day grace period", "Mistakes are reversible. The owner can return and stop everything."],
            [Flame, "Open architecture", "GenLayer contracts remain inspectable, understandable, and future-ready."],
          ].map(([Icon, title, body]) => (
            <Card key={title as string}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-5">{title as string}</CardTitle>
              <CardDescription className="mt-3 leading-7">{body as string}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-shell mt-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <div className="section-kicker">Demo will</div>
            <h2 className="section-title mt-3">Begin the story where the dashboard already breathes.</h2>
          </div>
          <Link href="/my-will" className="text-sm text-gold underline decoration-gold underline-offset-4">
            Enter the owner dashboard
          </Link>
        </div>
        <WillCard will={featuredWill} />
      </section>

      <footer className="section-shell mt-24 border-t border-white/8 py-10 text-sm text-white/45">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>Your legacy. On-chain. Forever. Even after you&apos;re gone.</p>
          <div className="flex items-center gap-2 text-gold/80">
            <Stars className="h-4 w-4" />
            GenLayer hackathon submission
          </div>
        </div>
      </footer>
    </div>
  );
}
