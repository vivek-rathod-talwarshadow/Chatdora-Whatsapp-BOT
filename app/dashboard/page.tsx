import { Activity, AlertTriangle, Bot, MessageSquareText, PhoneCall, ScrollText } from "lucide-react";

import { signOutAction } from "@/app/dashboard/actions";
import { DashboardHeader, DashboardSignOut } from "@/components/dashboard/dashboard-shell";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDashboardContext } from "@/lib/dashboard-data";

const statMeta = [
  { key: "totalFaqs", label: "Total FAQs", icon: ScrollText },
  { key: "totalLeads", label: "Total leads", icon: PhoneCall },
  { key: "totalMessages", label: "Total messages", icon: MessageSquareText },
  { key: "aiRepliesToday", label: "AI replies today", icon: Bot }
] as const;

function uniqueByPhone<T extends { customer_phone: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.customer_phone)) {
      return false;
    }

    seen.add(item.customer_phone);
    return true;
  });
}

export default async function DashboardPage() {
  const { business, stats, inboundCallbackHealth, qrLocalTestMode, user, plan } = await getDashboardContext();
  const supabase = getSupabaseAdmin();
  const [{ data: recentLeads }, { data: recentMessages }] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("messages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
  ]);
  const uniqueRecentLeads = uniqueByPhone(recentLeads ?? []);
  const uniqueRecentMessages = uniqueByPhone(recentMessages ?? []);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard overview"
        description="Track your FAQ coverage, lead flow, message volume, and whether fallback AI and WhatsApp are healthy."
        action={<DashboardSignOut action={signOutAction} />}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statMeta.map((item) => {
          const Icon = item.icon;
          const value = stats[item.key];
          return (
            <Card key={item.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{item.label}</CardDescription>
                  <div className="rounded-2xl bg-secondary p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl">{String(value)}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {!plan.isPlus ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Free plan usage</CardTitle>
              <CardDescription>Your free workspace keeps replies active with a lightweight storage mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                Monthly messages used: <span className="font-medium text-foreground">{plan.monthlyMessageCount}</span> / 100
              </div>
              <div>
                Messages remaining: <span className="font-medium text-foreground">{plan.monthlyMessagesRemaining ?? 0}</span>
              </div>
              <div>Locked on Free: FAQ manager, Lead CRM, Contacts, and Conversation logs.</div>
            </CardContent>
          </Card>
          <UpgradeCard
            title="Upgrade to Plus"
            description="Plus unlocks all current ChatDora features and removes the 100 messages/month free cap."
          />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bot status</CardTitle>
            <CardDescription>Quick health snapshot for your active business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Bot active
              </div>
              <Badge variant={stats.botStatus ? "success" : "danger"}>{stats.botStatus ? "Enabled" : "Disabled"}</Badge>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <PhoneCall className="h-4 w-4 text-primary" />
                WhatsApp
              </div>
              <Badge variant={stats.whatsappStatus ? "success" : "danger"}>
                {qrLocalTestMode ? "Local test mode active" : stats.whatsappStatus ? "Reply ready" : "Connected but not reply ready"}
              </Badge>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Fallback message
              </div>
              <p className="break-words text-sm leading-7 text-muted-foreground">
                {business?.ai_fallback_message || business?.default_fallback_message || "Using safe default response"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Your bot replies use this context first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="font-medium">{business?.business_name || "No business added yet"}</div>
              <div className="text-muted-foreground">{business?.category || "Add your business category"}</div>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-4 text-muted-foreground">
              {business?.short_description || "Add a short description, services, and opening hours to improve AI replies."}
            </div>
            {!inboundCallbackHealth.isPublic ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Local QR test mode is active for this app URL: {inboundCallbackHealth.appUrl}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 space-y-3 overflow-auto pr-1">
              {plan.isPlus && uniqueRecentLeads.length ? (
                uniqueRecentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-border p-4">
                    <div className="font-medium">{lead.customer_name || lead.customer_phone}</div>
                    <div className="text-sm text-muted-foreground">{lead.message}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  {plan.isPlus
                    ? "Leads will appear here after customers show buying intent."
                    : "Lead storage is available on the Plus plan."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 space-y-3 overflow-auto pr-1">
              {plan.isPlus && uniqueRecentMessages.length ? (
                uniqueRecentMessages.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{message.customer_name || message.customer_phone}</div>
                        {message.customer_name ? (
                          <div className="text-xs text-muted-foreground">{message.customer_phone}</div>
                        ) : null}
                      </div>
                      <Badge variant="outline">{message.reply_source}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{message.incoming_message}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  {plan.isPlus
                    ? "Message logs will appear here after webhook traffic starts."
                    : "Conversation logs are available on the Plus plan."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
