import { updateLeadStatusAction } from "@/app/dashboard/actions";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { SubmitButton } from "@/components/forms/submit-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanSummaryForBusiness } from "@/lib/billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatTimestamp(value: string) {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function groupLeadsByContact<T extends { customer_phone: string; created_at: string }>(leads: T[]) {
  const grouped = new Map<string, { lead: T; count: number }>();

  for (const lead of leads) {
    const existing = grouped.get(lead.customer_phone);
    if (!existing) {
      grouped.set(lead.customer_phone, { lead, count: 1 });
      continue;
    }

    existing.count += 1;
  }

  return Array.from(grouped.values());
}

const leadStatusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" }
];

export default async function LeadsPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    status?: string;
    interest?: string;
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
          title="Lead CRM"
          description="Track customers who asked about pricing, services, demos, bookings, or stayed engaged with follow-up questions."
        />
        <UpgradeCard
          title="Lead CRM is locked on Free"
          description="Free users do not store lead CRM records. Upgrade to Plus to capture and manage leads."
        />
      </div>
    );
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const query = searchParams?.q?.trim().toLowerCase() ?? "";
  const statusFilter = searchParams?.status?.trim() || "all";
  const interestFilter = searchParams?.interest?.trim() || "all";
  const allLeads = leads ?? [];
  const interestOptions = [
    { value: "all", label: "All interests" },
    ...Array.from(new Set(allLeads.map((lead) => lead.interest).filter(Boolean))).map((interest) => ({
      value: interest,
      label: interest
    }))
  ];
  const filteredLeads = allLeads.filter((lead) => {
    const matchesQuery =
      !query ||
      [lead.customer_name, lead.customer_phone, lead.message, lead.notes, lead.interest]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesInterest = interestFilter === "all" || lead.interest === interestFilter;

    return matchesQuery && matchesStatus && matchesInterest;
  });
  const groupedLeads = groupLeadsByContact(filteredLeads);

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Lead CRM"
        description="Track customers who asked about pricing, services, demos, bookings, or stayed engaged with follow-up questions."
      />
      <DashboardFilters
        searchPlaceholder="Search by name, phone, message, notes, or interest"
        searchValue={searchParams?.q}
        clearHref="/dashboard/leads"
        filters={[
          { name: "status", label: "Status", defaultValue: statusFilter, options: [{ value: "all", label: "All statuses" }, ...leadStatusOptions] },
          { name: "interest", label: "Interest", defaultValue: interestFilter, options: interestOptions }
        ]}
      />
      {groupedLeads.length ? (
        <div className="max-h-[72vh] overflow-auto rounded-3xl border border-border p-1">
          <div className="grid gap-5 xl:grid-cols-2">
            {groupedLeads.map(({ lead, count }) => (
              <Card key={lead.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{lead.customer_name || lead.customer_phone}</CardTitle>
                      <p className="text-sm text-muted-foreground">{lead.customer_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {count > 1 ? <Badge variant="outline">{count} inquiries</Badge> : null}
                      <Badge>{lead.interest || "general"}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="rounded-2xl bg-secondary/60 p-4 text-sm">{lead.message}</p>
                  <form action={updateLeadStatusAction} className="space-y-3">
                    <input type="hidden" name="id" value={lead.id} />
                    <CustomSelect name="status" defaultValue={lead.status} options={leadStatusOptions} />
                    <Textarea name="notes" defaultValue={lead.notes ?? ""} placeholder="Internal notes..." className="min-h-[100px]" />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{formatTimestamp(lead.created_at)}</span>
                      <SubmitButton variant="outline" loadingText="Updating...">
                        Update status
                      </SubmitButton>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title={allLeads.length ? "No leads match these filters" : "No leads yet"}
          description={
            allLeads.length
              ? "Try a different search or reset the filters to see more lead records."
              : "Lead records appear when incoming messages show buyer intent."
          }
        />
      )}
    </div>
  );
}
