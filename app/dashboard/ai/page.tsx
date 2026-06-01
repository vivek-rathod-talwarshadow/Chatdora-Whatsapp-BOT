import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAISettingsAction } from "@/app/dashboard/actions";
import { getUserBusiness } from "@/lib/dashboard-data";

export default async function AIPage() {
  const { business, plan } = await getUserBusiness();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="AI settings"
        description="Control the AI reply toggle, rule-based preference, timeout, and token budget."
      />
      {!plan.isPlus ? (
        <UpgradeCard
          title="Free plan active"
          description="AI settings stay available on Free, but Plus unlocks FAQ manager, Lead CRM, Contacts, Conversation logs, and removes the 100 messages/month cap."
        />
      ) : null}
      {!business ? (
        <EmptyState title="Business required" description="Save the business profile before editing AI settings." />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle>Reply settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={updateAISettingsAction} className="space-y-4">
                  <input type="hidden" name="business_id" value={business.id} />
                  <CheckboxField name="ai_enabled" label="Enable AI replies" defaultChecked={business.ai_enabled} />
                  <CheckboxField
                    name="rule_based_first"
                    label="Prefer rule-based FAQ match first"
                    defaultChecked={business.rule_based_first}
                  />
                  <CheckboxField name="bot_active" label="Bot active" defaultChecked={business.bot_active} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="ai_temperature">Temperature</Label>
                      <Input id="ai_temperature" name="ai_temperature" type="number" step="0.1" min="0" max="1" defaultValue={business.ai_temperature} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai_max_tokens">Max tokens</Label>
                      <Input id="ai_max_tokens" name="ai_max_tokens" type="number" min="50" max="600" defaultValue={business.ai_max_tokens} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai_timeout_seconds">Timeout seconds</Label>
                      <Input id="ai_timeout_seconds" name="ai_timeout_seconds" type="number" min="5" max="30" defaultValue={business.ai_timeout_seconds} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai_fallback_message">Fallback message</Label>
                    <Textarea id="ai_fallback_message" name="ai_fallback_message" defaultValue={business.ai_fallback_message ?? ""} className="min-h-[120px]" />
                  </div>
                  <SubmitButton loadingText="Saving AI settings...">Save AI settings</SubmitButton>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ChatDora AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border p-4">
                  ChatDora AI powers automated replies for FAQs, customer questions, and fallback responses.
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storage policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>AI provider logs are disabled to keep database usage low in production.</p>
              <p>{plan.isPlus ? "Only recent message history is retained for bot context and dashboard visibility." : "Free workspaces do not store conversation logs, leads, contacts, or FAQs."}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
