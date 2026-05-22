import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";

import { AssetAllocation } from "@/components/AssetAllocation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WillStatusBadge } from "@/components/WillStatusBadge";
import type { WillRecord } from "@/lib/mockWills";
import { formatDate } from "@/lib/utils";

export function WillCard({ will }: { will: WillRecord }) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="section-kicker">Will {will.id}</div>
          <CardTitle className="mt-3">{will.title}</CardTitle>
          <CardDescription className="mt-2 max-w-xl">
            {will.ownerName} of {will.ownerCity}. Created on {formatDate(will.createdAt)}.
          </CardDescription>
        </div>
        <WillStatusBadge status={will.status} />
      </div>

      <AssetAllocation beneficiaries={will.beneficiaries} />

      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-black/15 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Clock3 className="h-4 w-4 text-gold" />
          Next check-in {formatDate(will.nextCheckIn)}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/messages/${will.id}`}>
            <Button variant="secondary">Messages</Button>
          </Link>
          <Link href={will.status === "GRACE_PERIOD" ? `/claim/${will.id}` : "/my-will"}>
            <Button className="gap-2">
              View details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
