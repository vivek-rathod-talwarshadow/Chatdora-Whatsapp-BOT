import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { WhatsAppConnectionPanel } from "@/components/dashboard/whatsapp-connection-panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserBusiness } from "@/lib/dashboard-data";

export default async function WhatsAppPage({
  searchParams
}: {
  searchParams?: {
    saved?: string;
    error?: string;
  };
}) {
  const { business, qrConnection, engineHealth, workspaceId, inboundCallbackHealth, plan } = await getUserBusiness();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Connect WhatsApp"
        description="Scan QR once and let ChatDora reply to your customers automatically."
      />
      {!plan.isPlus ? (
        <UpgradeCard
          title="Free plan active"
          description={`Free keeps WhatsApp replies active for up to 100 messages/month. Upgrade to Plus to unlock all dashboard modules and unlimited growth beyond the free cap.`}
        />
      ) : null}

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams?.saved === "1" ? <Badge variant="success">WhatsApp settings updated</Badge> : null}

      {!business ? (
        <EmptyState title="Business required" description="Save the business profile before connecting WhatsApp." />
      ) : (
        <>
          <WhatsAppConnectionPanel
            businessId={business.id}
            initialConnection={qrConnection}
            initialActiveMode={qrConnection?.mode ?? null}
            initialBotActive={business.bot_active}
            initialEngineHealth={engineHealth}
            inboundCallbackHealth={inboundCallbackHealth}
            workspaceId={workspaceId ?? `workspace_${business.id}`}
          />
        </>
      )}
    </div>
  );
}
