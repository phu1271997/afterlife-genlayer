import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { Beneficiary } from "@/lib/mockWills";
import { shortenAddress } from "@/lib/utils";

export function BeneficiaryList({
  beneficiaries,
}: {
  beneficiaries: Beneficiary[];
}) {
  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Beneficiaries</CardTitle>
        <CardDescription>
          The people entrusted with what remains and what matters.
        </CardDescription>
      </div>
      <div className="space-y-3">
        {beneficiaries.map((beneficiary) => (
          <div
            key={beneficiary.id}
            className="flex flex-col gap-2 rounded-[1.5rem] border border-white/10 bg-black/10 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-base text-white">{beneficiary.name}</div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                {beneficiary.relationship}
              </div>
            </div>
            <div className="text-xs text-white/55">{shortenAddress(beneficiary.address)}</div>
            <div className="font-display text-2xl text-gold">{beneficiary.share}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
