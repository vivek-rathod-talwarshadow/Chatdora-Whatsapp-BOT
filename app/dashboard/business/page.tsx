import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";
import { Badge } from "@/components/ui/badge";
import { getUserBusiness } from "@/lib/dashboard-data";
import { upsertBusinessAction } from "@/app/dashboard/actions";

export default async function BusinessPage({
  searchParams
}: {
  searchParams?: {
    saved?: string;
    error?: string;
    welcome?: string;
  };
}) {
  const { business, businessError } = await getUserBusiness();
  const showSaved = searchParams?.saved === "1";
  const actionError = searchParams?.error;
  const showWelcome = searchParams?.welcome === "1";

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Business profile"
        description="This profile powers deterministic FAQ replies and also becomes the grounding context for fallback AI models."
      />
      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          Save failed: {actionError}
        </div>
      ) : null}
      {businessError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          Database error: {businessError}. This usually means the Supabase SQL migration has not been run yet.
        </div>
      ) : null}
      <BusinessProfileForm
        business={business}
        showSaved={showSaved}
        action={upsertBusinessAction}
        businessError={businessError}
        showWelcome={showWelcome}
      />
    </div>
  );
}
