import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/dashboard/actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isOwnerSuperAdminEmail } from "@/lib/admin";
import { getAppUrl } from "@/lib/config";
import { getPlanSummaryForBusiness } from "@/lib/billing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminSupabase = getSupabaseAdmin();
  const { data: business } = await adminSupabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();
  const plan = await getPlanSummaryForBusiness({
    businessId: business?.id ?? null,
    userId: user.id
  });

  let appHostname = "localhost:3000";
  try {
    appHostname = new URL(getAppUrl()).host;
  } catch {
    appHostname = "localhost:3000";
  }

  return (
    <DashboardShell
      appHostname={appHostname}
      signOutAction={signOutAction}
      planName={plan.planName}
      monthlyMessagesRemaining={plan.monthlyMessagesRemaining}
      canSeeSuperAdmin={isOwnerSuperAdminEmail(user.email)}
    >
      {children}
    </DashboardShell>
  );
}
