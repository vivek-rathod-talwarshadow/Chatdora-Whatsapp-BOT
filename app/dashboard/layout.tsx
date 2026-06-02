import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/dashboard/actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getBusinessProfileCompletion } from "@/lib/business-onboarding";
import { isOwnerSuperAdminEmail } from "@/lib/admin";
import { getAppUrl } from "@/lib/config";
import { getPlanSummaryForBusiness } from "@/lib/billing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

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
  const { data: business } = await adminSupabase
    .from("businesses")
    .select("id, business_name, category, owner_name, phone, email, website, instagram, opening_hours, address, services, short_description, default_fallback_message, ai_fallback_message")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan = await getPlanSummaryForBusiness({
    businessId: business?.id ?? null,
    userId: user.id
  });
  const onboarding = getBusinessProfileCompletion(business);

  let appHostname = "chatdora.in";
  try {
    appHostname = new URL(getAppUrl()).host;
  } catch {
    appHostname = "chatdora.in";
  }

  return (
    <DashboardShell
      appHostname={appHostname}
      signOutAction={signOutAction}
      planName={plan.planName}
      monthlyMessagesRemaining={plan.monthlyMessagesRemaining}
      canSeeSuperAdmin={isOwnerSuperAdminEmail(user.email)}
      businessProfileCompletion={onboarding.percent}
      businessProfileReady={onboarding.isReadyForOverview}
    >
      {children}
    </DashboardShell>
  );
}
