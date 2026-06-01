import Link from "next/link";

import { PLUS_PLAN_PRICE_INR, UPGRADE_CONTACT_URL } from "@/lib/plans";
import { formatIndianCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function UpgradeCard({
  title = "Upgrade to Plus",
  description = "This feature is available on Plus only."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Plus</Badge>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Plus unlocks FAQ manager, Lead CRM, Contacts, Conversation logs, and keeps all current ChatDora features active.
        </div>
        <div className="text-3xl font-semibold">
          {formatIndianCurrency(PLUS_PLAN_PRICE_INR)}
          <span className="text-sm font-normal text-muted-foreground">/month</span>
        </div>
        <Button asChild>
          <Link href={UPGRADE_CONTACT_URL}>Upgrade to Plus</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
