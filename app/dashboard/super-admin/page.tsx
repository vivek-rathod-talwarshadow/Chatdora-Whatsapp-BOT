import { deleteUserAsSuperAdminAction, updateSubscriptionPlanAsSuperAdminAction } from "@/app/dashboard/actions";
import { requireOwnerSuperAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FREE_PLAN_NAME, PLUS_PLAN_NAME } from "@/lib/plans";

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function SuperAdminPage({
  searchParams
}: {
  searchParams?: { saved?: string; error?: string };
}) {
  const user = await getCurrentUser();

  requireOwnerSuperAdmin(user?.email);

  const adminSupabase = getSupabaseAdmin();
  const [{ data: authUsers }, { data: businesses }, { data: subscriptions }, { data: connections }, { data: messages }, { data: leads }] =
    await Promise.all([
      adminSupabase.auth.admin.listUsers(),
      adminSupabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(50),
      adminSupabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(50),
      adminSupabase.from("whatsapp_connections").select("*").order("updated_at", { ascending: false }).limit(50),
      adminSupabase.from("messages").select("*").order("created_at", { ascending: false }).limit(50),
      adminSupabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50)
    ]);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Super Admin"
        description="Owner-only control panel for users, businesses, subscriptions, WhatsApp connections, messages, and leads."
      />

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams?.saved === "1" ? <Badge variant="success">Super admin change saved.</Badge> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>Total users</CardDescription><CardTitle className="text-3xl">{authUsers.users.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Businesses</CardDescription><CardTitle className="text-3xl">{businesses?.length ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Subscriptions</CardDescription><CardTitle className="text-3xl">{subscriptions?.length ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Connections</CardDescription><CardTitle className="text-3xl">{connections?.length ?? 0}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Owner-only account management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[28rem] overflow-auto rounded-2xl border border-border">
            <Table>
              <THead>
                <TR>
                  <TH>Email</TH>
                  <TH>User ID</TH>
                  <TH>Created</TH>
                  <TH>Action</TH>
                </TR>
              </THead>
              <TBody>
                {authUsers.users.map((row) => (
                  <TR key={row.id}>
                    <TD>{row.email ?? "-"}</TD>
                    <TD className="max-w-xs break-all">{row.id}</TD>
                    <TD>{formatTimestamp(row.created_at)}</TD>
                    <TD>
                      <form action={deleteUserAsSuperAdminAction}>
                        <input type="hidden" name="user_id" value={row.id} />
                        <SubmitButton variant="destructive" loadingText="Deleting...">Delete user</SubmitButton>
                      </form>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>Change plan and billing status directly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {(subscriptions ?? []).map((subscription) => (
              <form key={subscription.id} action={updateSubscriptionPlanAsSuperAdminAction} className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
                <input type="hidden" name="subscription_id" value={subscription.id} />
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{subscription.business_id}</div>
                  <div className="text-muted-foreground">{subscription.user_id}</div>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <select name="plan_name" defaultValue={subscription.plan_name} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value={FREE_PLAN_NAME}>{FREE_PLAN_NAME}</option>
                    <option value={PLUS_PLAN_NAME}>{PLUS_PLAN_NAME}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input name="status" defaultValue={subscription.status} />
                </div>
                <SubmitButton loadingText="Saving...">Save</SubmitButton>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Businesses & connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[28rem] overflow-auto rounded-2xl border border-border">
              <Table>
                <THead>
                  <TR>
                    <TH>Business</TH>
                    <TH>Owner</TH>
                    <TH>Bot</TH>
                    <TH>Connection</TH>
                  </TR>
                </THead>
                <TBody>
                  {(businesses ?? []).map((business) => {
                    const connection = (connections ?? []).find((item) => item.business_id === business.id);
                    return (
                      <TR key={business.id}>
                        <TD>
                          <div>{business.business_name}</div>
                          <div className="text-xs text-muted-foreground">{business.id}</div>
                        </TD>
                        <TD className="max-w-xs break-all">{business.user_id}</TD>
                        <TD>{business.bot_active ? "On" : "Off"}</TD>
                        <TD>{connection ? `${connection.mode} · ${connection.status}` : "-"}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-3 font-medium">Messages</div>
              <div className="space-y-2">
                {(messages ?? []).slice(0, 10).map((message) => (
                  <div key={message.id} className="rounded-2xl border border-border p-3 text-sm">
                    <div className="font-medium">{message.customer_phone}</div>
                    <div className="text-muted-foreground">{message.incoming_message}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 font-medium">Leads</div>
              <div className="space-y-2">
                {(leads ?? []).slice(0, 10).map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-border p-3 text-sm">
                    <div className="font-medium">{lead.customer_phone}</div>
                    <div className="text-muted-foreground">{lead.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
