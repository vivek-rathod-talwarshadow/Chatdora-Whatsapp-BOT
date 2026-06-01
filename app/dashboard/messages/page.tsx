import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanSummaryForBusiness } from "@/lib/billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatTimestamp(value: string) {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function MessagesPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    source?: string;
  };
}) {
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

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
          title="Conversation logs"
          description="Inspect incoming messages, final replies, reply source, matched FAQ, and which AI model handled the message."
        />
        <UpgradeCard
          title="Conversation logs are locked on Free"
          description="Free users do not store conversation logs. Upgrade to Plus to unlock message history and reply inspection."
        />
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*, faqs(question)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const allMessages = messages ?? [];
  const query = searchParams?.q?.trim().toLowerCase() ?? "";
  const sourceFilter = searchParams?.source?.trim() || "all";
  const filteredMessages = allMessages.filter((message) => {
    const matchesQuery =
      !query ||
      [message.customer_name, message.customer_phone, message.incoming_message, message.bot_reply, message.faqs?.question]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesSource = sourceFilter === "all" || message.reply_source === sourceFilter;

    return matchesQuery && matchesSource;
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Conversation logs"
        description="Inspect incoming messages, final replies, reply source, matched FAQ, and which AI model handled the message."
      />
      <DashboardFilters
        searchPlaceholder="Search by customer, incoming message, reply, or FAQ"
        searchValue={searchParams?.q}
        clearHref="/dashboard/messages"
        filters={[
          {
            name: "source",
            label: "Reply source",
            defaultValue: sourceFilter,
            options: [
              { value: "all", label: "All sources" },
              { value: "faq", label: "FAQ" },
              { value: "ai", label: "AI" },
              { value: "fallback", label: "Fallback" }
            ]
          }
        ]}
      />
      {filteredMessages.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-border">
              <Table>
              <THead>
                <TR>
                  <TH>Customer</TH>
                  <TH>Incoming</TH>
                  <TH>Reply</TH>
                  <TH>Source</TH>
                  <TH>Model</TH>
                  <TH>Matched FAQ</TH>
                  <TH>Time</TH>
                </TR>
              </THead>
              <TBody>
                {filteredMessages.map((message) => (
                  <TR key={message.id}>
                    <TD>
                      <div className="font-medium">{message.customer_name || message.customer_phone}</div>
                      {message.customer_name ? (
                        <div className="text-xs text-muted-foreground">{message.customer_phone}</div>
                      ) : null}
                    </TD>
                    <TD className="max-w-xs text-muted-foreground">{message.incoming_message}</TD>
                    <TD className="max-w-xs">{message.bot_reply}</TD>
                    <TD>
                      <Badge>{message.reply_source}</Badge>
                    </TD>
                    <TD>{message.reply_source === "ai" ? "ChatDora AI" : "-"}</TD>
                    <TD>{message.faqs?.question || "-"}</TD>
                    <TD>{formatTimestamp(message.created_at)}</TD>
                  </TR>
                ))}
              </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title={allMessages.length ? "No messages match these filters" : "No messages yet"}
          description={
            allMessages.length
              ? "Try a broader search or reset the filters to review more recent conversations."
              : "Webhook traffic and test-bot runs will start populating logs."
          }
        />
      )}
    </div>
  );
}
