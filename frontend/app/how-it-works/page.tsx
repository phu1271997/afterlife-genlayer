import { BrainCircuit, Clock3, LockKeyhole, Scale } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function HowItWorksPage() {
  return (
    <div className="section-shell py-14">
      <div className="mx-auto max-w-5xl space-y-14">
        <div>
          <div className="section-kicker">How it works</div>
          <h1 className="mt-3 font-display text-6xl text-white">A three-layer protocol for a deeply human problem.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/68">
            Traditional smart contracts cannot know whether someone has died. AfterLife exists because GenLayer gives
            contracts the ability to read the world and reason about ambiguity without trusting a single oracle.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="space-y-4">
            <Clock3 className="h-6 w-6 text-gold" />
            <CardTitle>Layer 1: Proof of life</CardTitle>
            <CardDescription className="leading-7">
              Owners check in every 30, 60, or 90 days. Missing three cycles triggers verification rather than immediate execution.
            </CardDescription>
          </Card>
          <Card className="space-y-4">
            <BrainCircuit className="h-6 w-6 text-gold" />
            <CardTitle>Layer 2: AI death verification</CardTitle>
            <CardDescription className="leading-7">
              GenLayer validators render obituary pages, inspect memorial signals, and run conservative AI prompts that prefer uncertainty over harm.
            </CardDescription>
          </Card>
          <Card className="space-y-4">
            <Scale className="h-6 w-6 text-gold" />
            <CardTitle>Layer 3: Time-locked grace</CardTitle>
            <CardDescription className="leading-7">
              Even a confirmed verdict only begins a 14-day reversible window. The owner can return, beneficiaries can dispute, and nothing irreversible happens immediately.
            </CardDescription>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="document-card p-8">
            <div className="section-kicker text-stone-500">Why GenLayer matters</div>
            <h2 className="mt-4 font-display text-5xl text-stone-900">This cannot be done with ordinary contracts.</h2>
            <ul className="mt-6 space-y-4 text-stone-700">
              <li>GenLayer can render obituaries and memorial sites directly from the contract execution path.</li>
              <li>AI prompts allow validators to judge whether evidence is sufficient, suspicious, or inconclusive.</li>
              <li>Consensus across validators prevents a single actor from deciding life and death.</li>
            </ul>
          </div>

          <Card className="space-y-5">
            <LockKeyhole className="h-6 w-6 text-gold" />
            <CardTitle>Privacy model</CardTitle>
            <CardDescription className="leading-7">
              On-chain records store will metadata, beneficiaries, and verification outcomes. Final message payloads can be encrypted in production, while rich media stays off-chain and is referenced only when release is appropriate.
            </CardDescription>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5 text-sm leading-7 text-white/62">
              The demo keeps focus on verifiability and emotional clarity. Production versions would add encryption, wallet recovery, and asset-specific release adapters.
            </div>
          </Card>
        </div>

        <div className="glass-card p-8">
          <div className="section-kicker">Comparison</div>
          <h2 className="mt-4 font-display text-5xl text-white">AfterLife vs the alternatives</h2>
          <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/10">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.28em] text-white/45">
                <tr>
                  <th className="px-4 py-4">Approach</th>
                  <th className="px-4 py-4">Death awareness</th>
                  <th className="px-4 py-4">Reversible</th>
                  <th className="px-4 py-4">Trust model</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-4 font-display text-xl text-white">AfterLife</td>
                  <td className="px-4 py-4">AI-verified, multi-source</td>
                  <td className="px-4 py-4">Yes, 14-day grace</td>
                  <td className="px-4 py-4">Validator consensus on GenLayer</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-4">Traditional will</td>
                  <td className="px-4 py-4">Court-driven</td>
                  <td className="px-4 py-4">Slow and costly</td>
                  <td className="px-4 py-4">Lawyers and probate system</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-4">Dead-man&apos;s switch</td>
                  <td className="px-4 py-4">No actual verification</td>
                  <td className="px-4 py-4">Poor</td>
                  <td className="px-4 py-4">Single timer or custodian</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-4">Centralized inheritance apps</td>
                  <td className="px-4 py-4">Manual review</td>
                  <td className="px-4 py-4">Provider-dependent</td>
                  <td className="px-4 py-4">Company database and policy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
