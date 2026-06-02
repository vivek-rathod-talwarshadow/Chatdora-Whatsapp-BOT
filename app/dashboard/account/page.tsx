import { AlertTriangle, KeyRound, UserRound } from "lucide-react";

import {
  deleteAccountAction,
  updateAccountPasswordAction,
  updateAccountProfileAction
} from "@/app/dashboard/actions";
import { getPlanSummaryForBusiness } from "@/lib/billing";
import { PLUS_PLAN_PRICE_INR, UPGRADE_CONTACT_URL } from "@/lib/plans";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { SubmitButton } from "@/components/forms/submit-button";
import { NativeAppCard } from "@/components/pwa/native-app-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatIndianCurrency } from "@/lib/utils";

export default async function AccountPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const authSupabase = await createSupabaseServerClient();
  const adminSupabase = getSupabaseAdmin();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [{ data: profile }, { data: business }] = await Promise.all([
    adminSupabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    adminSupabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle()
  ]);
  const plan = await getPlanSummaryForBusiness({
    businessId: business?.id ?? null,
    userId: user.id
  });
  const saved = searchParams?.saved === "1";
  const emailChange = searchParams?.emailChange === "1";
  const passwordUpdated = searchParams?.passwordUpdated === "1";
  const error = typeof searchParams?.error === "string" ? searchParams.error : null;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="My account"
        description="Manage your name, login details, password, and account lifecycle from one place."
      />

      {saved ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          Account details updated successfully.
          {emailChange ? " Check your email inbox to confirm the new email address if Supabase email confirmation is enabled." : ""}
        </div>
      ) : null}

      {passwordUpdated ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          Password updated successfully.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Plan & billing</CardTitle>
              <CardDescription>ChatDora keeps pricing simple with one free tier and one paid tier.</CardDescription>
            </div>
            <Badge variant={plan.isPlus ? "success" : "secondary"}>{plan.planName}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {plan.isPlus
              ? `Your Plus plan is active at ${formatIndianCurrency(PLUS_PLAN_PRICE_INR)}/month.`
              : `You are on the Free plan. Plus is ${formatIndianCurrency(PLUS_PLAN_PRICE_INR)}/month.`}
          </div>
          {!plan.isPlus ? (
            <>
              <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                Free includes bot replies with up to 100 messages/month. FAQ manager, Lead CRM, Contacts, and Conversation logs are locked until you upgrade.
              </div>
              <Button asChild>
                <a href={UPGRADE_CONTACT_URL}>Upgrade to Plus</a>
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      <NativeAppCard />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Profile details</CardTitle>
                <CardDescription>Update the name and contact details shown for your account.</CardDescription>
              </div>
              <Badge variant="secondary">
                <UserRound className="mr-1 h-3.5 w-3.5" />
                Profile
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form action={updateAccountProfileAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">User name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? user.user_metadata?.full_name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={profile?.email ?? user.email ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} placeholder="+91..." />
              </div>
              <SubmitButton loadingText="Saving profile...">Save profile</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Change your password and review core account metadata.</CardDescription>
              </div>
              <Badge variant="outline">
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                Secure
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border p-4 text-sm">
              <div className="font-medium">User ID</div>
              <div className="mt-1 break-all text-muted-foreground">{user.id}</div>
            </div>
            <div className="rounded-2xl border border-border p-4 text-sm">
              <div className="font-medium">Created</div>
              <div className="mt-1 text-muted-foreground">{new Date(user.created_at).toISOString().replace("T", " ").slice(0, 16)} UTC</div>
            </div>
            <form action={updateAccountPasswordAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <Input id="confirm_password" name="confirm_password" type="password" minLength={8} />
              </div>
              <SubmitButton loadingText="Updating password...">Update password</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-rose-200/70 dark:border-rose-500/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>Delete your account and all associated ChatDora data permanently.</CardDescription>
            </div>
            <Badge variant="danger">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              Permanent
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            This deletes your login plus business profile, FAQs, WhatsApp settings, messages, leads, and saved account data.
          </div>
          <form action={deleteAccountAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Before deleting</Label>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                Deleting your account is permanent and cannot be undone.
              </div>
            </div>
            <SubmitButton variant="destructive" loadingText="Deleting account...">
              Delete account permanently
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
