import type { Beneficiary } from "@/lib/mockWills";

export function AssetAllocation({
  beneficiaries,
}: {
  beneficiaries: Beneficiary[];
}) {
  let offset = 0;

  return (
    <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
      <svg viewBox="0 0 42 42" className="mx-auto h-40 w-40 -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        {beneficiaries.map((beneficiary, index) => {
          const circumference = 100;
          const dash = `${beneficiary.share} ${circumference - beneficiary.share}`;
          const strokeDashoffset = 25 - offset;
          offset += beneficiary.share;
          const palette = ["#D4A574", "#A78BFA", "#65A30D", "#D97706"];
          return (
            <circle
              key={beneficiary.id}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={palette[index % palette.length]}
              strokeWidth="4"
              strokeDasharray={dash}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
      </svg>

      <div className="space-y-3">
        {beneficiaries.map((beneficiary, index) => {
          const palette = ["#D4A574", "#A78BFA", "#65A30D", "#D97706"];
          return (
            <div
              key={beneficiary.id}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: palette[index % palette.length] }}
                />
                <div>
                  <div className="text-sm text-white">{beneficiary.name}</div>
                  <div className="text-xs text-white/50">{beneficiary.relationship}</div>
                </div>
              </div>
              <div className="font-display text-xl text-gold">{beneficiary.share}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
