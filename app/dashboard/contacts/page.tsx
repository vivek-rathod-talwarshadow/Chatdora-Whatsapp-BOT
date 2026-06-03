import { Pause, Play } from "lucide-react";

import { toggleCustomerBotPauseAction } from "@/app/dashboard/actions";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPausedCustomerPhones } from "@/lib/whatsapp/connections";
import { getPlanSummaryForBusiness } from "@/lib/billing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function formatTimestamp(value: string | null | undefined) {
  if (!value) {
    return "No recent activity";
  }

  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

type ContactSummary = {
  customer_phone: string;
  customer_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  message_count: number;
  lead_count: number;
};

function upsertContactSummary(
  map: Map<string, ContactSummary>,
  contact: {
    customer_phone: string;
    customer_name?: string | null;
    preview?: string | null;
    created_at?: string | null;
    kind: "message" | "lead";
  }
) {
  const existing = map.get(contact.customer_phone);
  const candidateTime = contact.created_at ? new Date(contact.created_at).getTime() : 0;

  if (!existing) {
    map.set(contact.customer_phone, {
      customer_phone: contact.customer_phone,
      customer_name: contact.customer_name ?? null,
      last_message_preview: contact.preview ?? null,
      last_message_at: contact.created_at ?? null,
      message_count: contact.kind === "message" ? 1 : 0,
      lead_count: contact.kind === "lead" ? 1 : 0
    });
    return;
  }

  existing.message_count += contact.kind === "message" ? 1 : 0;
  existing.lead_count += contact.kind === "lead" ? 1 : 0;

  if (!existing.customer_name && contact.customer_name) {
    existing.customer_name = contact.customer_name;
  }

  const existingTime = existing.last_message_at ? new Date(existing.last_message_at).getTime() : 0;
  if (candidateTime >= existingTime) {
    existing.last_message_at = contact.created_at ?? existing.last_message_at;
    existing.last_message_preview = contact.preview ?? existing.last_message_preview;
    if (contact.customer_name) {
      existing.customer_name = contact.customer_name;
    }
  }
}

export default async function ContactsPage({
  searchParams
}: {
  searchParams?: {
    saved?: string;
    state?: string;
    phone?: string;
    error?: string;
    q?: string;
    bot?: string;
    leads?: string;
  };
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = getSupabaseAdmin();
  const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();
  const plan = await getPlanSummaryForBusiness({
    businessId: business?.id ?? null,
    userId: user.id
  });

  if (!plan.isPlus) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Contacts"
          description="See everyone who has messaged your business and pause or resume bot replies for specific contacts."
        />
        <UpgradeCard
          title="Contacts are locked on Free"
          description="Free users do not store contact timelines. Upgrade to Plus to manage contacts and pause bot replies per customer."
        />
      </div>
    );
  }

  const [{ data: messages }, { data: leads }, { data: connection }] = await Promise.all([
    supabase
      .from("messages")
      .select("customer_phone, customer_name, incoming_message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("leads")
      .select("customer_phone, customer_name, message, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase.from("whatsapp_connections").select("engine_status").eq("user_id", user.id).maybeSingle()
  ]);

  const contacts = new Map<string, ContactSummary>();

  for (const message of messages ?? []) {
    upsertContactSummary(contacts, {
      customer_phone: message.customer_phone,
      customer_name: message.customer_name,
      preview: message.incoming_message,
      created_at: message.created_at,
      kind: "message"
    });
  }

  for (const lead of leads ?? []) {
    upsertContactSummary(contacts, {
      customer_phone: lead.customer_phone,
      customer_name: lead.customer_name,
      preview: lead.message,
      created_at: lead.created_at,
      kind: "lead"
    });
  }

  const pausedPhones = new Set(getPausedCustomerPhones(connection?.engine_status));
  const query = searchParams?.q?.trim().toLowerCase() ?? "";
  const botFilter = searchParams?.bot?.trim() || "all";
  const leadsFilter = searchParams?.leads?.trim() || "all";

  const contactList = Array.from(contacts.values())
    .filter((contact) => {
      const isPaused = pausedPhones.has(contact.customer_phone);
      const matchesQuery =
        !query ||
        [contact.customer_name, contact.customer_phone, contact.last_message_preview]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const matchesBotState =
        botFilter === "all" || (botFilter === "paused" ? isPaused : !isPaused);
      const matchesLeadState =
        leadsFilter === "all" || (leadsFilter === "with-leads" ? contact.lead_count > 0 : contact.lead_count === 0);

      return matchesQuery && matchesBotState && matchesLeadState;
    })
    .sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Contacts"
        description="See everyone who has messaged your business and pause or resume bot replies for specific contacts."
      />
      <DashboardFilters
        searchPlaceholder="Search by contact name, phone, or last message"
        searchValue={searchParams?.q}
        clearHref="/dashboard/contacts"
        filters={[
          {
            name: "bot",
            label: "Bot status",
            defaultValue: botFilter,
            options: [
              { value: "all", label: "All contacts" },
              { value: "active", label: "Bot active" },
              { value: "paused", label: "Bot paused" }
            ]
          },
          {
            name: "leads",
            label: "Lead activity",
            defaultValue: leadsFilter,
            options: [
              { value: "all", label: "All lead states" },
              { value: "with-leads", label: "Has leads" },
              { value: "without-leads", label: "No leads yet" }
            ]
          }
        ]}
      />

      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams?.saved === "1" ? (
        <Badge variant="success">
          Bot replies {searchParams.state === "paused" ? "paused" : "resumed"} for {searchParams.phone}
        </Badge>
      ) : null}

      {!business ? (
        <EmptyState title="Business required" description="Save the business profile before managing customer contacts." />
      ) : contactList.length ? (
        <div className="max-h-[72vh] overflow-auto rounded-3xl border border-border p-1 pr-2">
          <div className="grid gap-5 xl:grid-cols-2">
            {contactList.map((contact) => {
              const isPaused = pausedPhones.has(contact.customer_phone);

              return (
                <Card key={contact.customer_phone}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{contact.customer_name || contact.customer_phone}</CardTitle>
                        {contact.customer_name ? (
                          <p className="text-sm text-muted-foreground">{contact.customer_phone}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isPaused ? "outline" : "success"}>{isPaused ? "Paused" : "Active"}</Badge>
                        <Badge variant="outline">{contact.message_count} messages</Badge>
                        {contact.lead_count ? <Badge>{contact.lead_count} leads</Badge> : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
                      {contact.last_message_preview || "No recent message preview available."}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">Last activity: {formatTimestamp(contact.last_message_at)}</div>
                      <form action={toggleCustomerBotPauseAction}>
                        <input type="hidden" name="business_id" value={business.id} />
                        <input type="hidden" name="customer_phone" value={contact.customer_phone} />
                        <input type="hidden" name="should_pause" value={String(!isPaused)} />
                        <SubmitButton variant="outline" loadingText={isPaused ? "Resuming..." : "Pausing..."}>
                          {isPaused ? (
                            <span className="inline-flex items-center gap-2">
                              <Play className="h-4 w-4" />
                              Resume bot
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Pause className="h-4 w-4" />
                              Pause bot
                            </span>
                          )}
                        </SubmitButton>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title={contacts.size ? "No contacts match these filters" : "No contacts yet"}
          description={
            contacts.size
              ? "Adjust the search or reset the filters to bring more contacts back into view."
              : "Contacts will appear here after customers message your WhatsApp bot."
          }
        />
      )}
    </div>
  );
}
