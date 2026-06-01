import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { TestBotSimulator } from "@/components/dashboard/test-bot-simulator";
import { EmptyState } from "@/components/ui/empty-state";
import { getUserBusiness } from "@/lib/dashboard-data";

export default async function TestBotPage() {
  const { business } = await getUserBusiness();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Test bot"
        description="Use the internal simulator to preview FAQ matching, AI fallback, lead detection, and final response without sending WhatsApp messages."
      />
      {business ? (
        <TestBotSimulator businessId={business.id} />
      ) : (
        <EmptyState title="Business required" description="Create your business profile before testing the bot." />
      )}
    </div>
  );
}
