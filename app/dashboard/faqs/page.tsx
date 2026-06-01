import { Search } from "lucide-react";

import { upsertFaqAction } from "@/app/dashboard/actions";
import { DeleteFaqButton } from "@/components/forms/delete-faq-button";
import { SubmitButton } from "@/components/forms/submit-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { getUserBusiness } from "@/lib/dashboard-data";

export default async function FAQsPage({
  searchParams
}: {
  searchParams?: { q?: string; saved?: string; deleted?: string; error?: string; upgrade?: string };
}) {
  const query = searchParams?.q?.toLowerCase() ?? "";
  const { business, supabase, user, plan } = await getUserBusiness();
  const { data: faqs } = business
    ? await supabase
        .from("faqs")
        .select("*")
        .eq("business_id", business.id)
        .eq("user_id", user.id)
        .order("priority", { ascending: false })
    : { data: [] };
  const filteredFaqs = (faqs ?? []).filter((faq) => {
    if (!query) return true;
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      (faq.keywords ?? []).join(" ").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="FAQ manager"
        description="Add your best answers, keywords, and priority so ChatDora can reply deterministically before asking AI."
      />
      {!business ? (
        <EmptyState title="Add your business first" description="Create the business profile before training FAQs." />
      ) : null}
      {searchParams?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams?.saved === "1" ? <Badge variant="success">FAQ saved successfully</Badge> : null}
      {searchParams?.deleted === "1" ? <Badge variant="success">FAQ deleted successfully</Badge> : null}
      {searchParams?.upgrade === "1" || !plan.isPlus ? (
        <UpgradeCard
          title="FAQ manager is locked on Free"
          description="Free users can keep the bot running, but FAQ manager is available only on Plus."
        />
      ) : null}

      {business && plan.isPlus ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Add or update FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={upsertFaqAction} className="space-y-4">
                <input type="hidden" name="business_id" value={business.id} />
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input id="question" name="question" required placeholder="Do you offer same-day delivery?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea id="answer" name="answer" required className="min-h-[140px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input id="keywords" name="keywords" placeholder="delivery, same day, shipping" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input id="priority" name="priority" type="number" min="0" defaultValue="10" />
                  </div>
                  <CheckboxField name="is_active" label="Active FAQ" defaultChecked className="self-end" />
                </div>
                <SubmitButton loadingText="Saving FAQ...">Save FAQ</SubmitButton>
              </form>
            </CardContent>
          </Card>

          <div className="max-h-[72vh] space-y-4 overflow-auto pr-1">
            <form className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={searchParams?.q ?? ""} placeholder="Search FAQs..." className="pl-11" />
            </form>
            {filteredFaqs.length ? (
              filteredFaqs.map((faq) => (
                <Card key={faq.id}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{faq.question}</h3>
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                      <DeleteFaqButton faqId={faq.id} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Priority {faq.priority}</Badge>
                      <Badge variant={faq.is_active ? "success" : "outline"}>{faq.is_active ? "Active" : "Inactive"}</Badge>
                      {(faq.keywords ?? []).map((keyword: string) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <form action={upsertFaqAction} className="grid gap-3 rounded-2xl border border-border p-4">
                      <input type="hidden" name="id" value={faq.id} />
                      <input type="hidden" name="business_id" value={business.id} />
                      <Input name="question" defaultValue={faq.question} required />
                      <Textarea name="answer" defaultValue={faq.answer} className="min-h-[120px]" required />
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input name="keywords" defaultValue={(faq.keywords ?? []).join(", ")} />
                        <Input name="priority" type="number" defaultValue={faq.priority} />
                        <CheckboxField name="is_active" label="Active" defaultChecked={faq.is_active} />
                      </div>
                      <SubmitButton variant="outline" loadingText="Updating FAQ...">
                        Update FAQ
                      </SubmitButton>
                    </form>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState title="No FAQs found" description="Create your first FAQ or adjust the search term." />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
