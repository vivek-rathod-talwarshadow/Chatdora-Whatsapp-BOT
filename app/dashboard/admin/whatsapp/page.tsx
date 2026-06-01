import { Globe2, Lock } from "lucide-react";

import { upsertWhatsAppSettingsAction } from "@/app/dashboard/actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { WhatsAppTestButton } from "@/components/dashboard/whatsapp-test-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppUrl } from "@/lib/config";
import { getUserBusiness } from "@/lib/dashboard-data";

export default async function AdminWhatsAppPage() {
  const { business, officialSettings } = await getUserBusiness();
  const webhookUrl = `${getAppUrl()}/api/webhook/whatsapp`;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Advanced WhatsApp API setup"
        description="Official Meta Cloud API settings are still supported, but QR login is recommended for the default experience."
        action={
          <Button asChild variant="outline">
            <a href="/dashboard/whatsapp">Back to QR setup</a>
          </Button>
        }
      />

      {!business ? (
        <EmptyState title="Business required" description="Save the business profile before configuring advanced WhatsApp API mode." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Official API credentials</CardTitle>
              <CardDescription>These fields are hidden from the main setup flow and should only be used for advanced deployments.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={upsertWhatsAppSettingsAction} className="space-y-4">
                <input type="hidden" name="id" value={officialSettings?.id ?? ""} />
                <input type="hidden" name="business_id" value={business.id} />
                <div className="space-y-2">
                  <Label htmlFor="phone_number_id">Phone number ID</Label>
                  <Input id="phone_number_id" name="phone_number_id" defaultValue={officialSettings?.phone_number_id ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access_token">Access token</Label>
                  <Input id="access_token" name="access_token" type="password" required={!officialSettings?.access_token} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verify_token">Verify token</Label>
                  <Input id="verify_token" name="verify_token" type="password" required={!officialSettings?.verify_token} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app_secret">App secret</Label>
                  <Input id="app_secret" name="app_secret" type="password" />
                </div>
                <CheckboxField
                  name="is_connected"
                  label="Mark official API mode as active"
                  defaultChecked={officialSettings?.is_connected ?? false}
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Save advanced settings</Button>
                  <WhatsAppTestButton />
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Webhook details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
                  <Globe2 className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Dynamic callback URL</div>
                    <div className="break-all text-muted-foreground">{webhookUrl}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
                  <Lock className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Verification behavior</div>
                    <div className="text-muted-foreground">
                      GET webhook verification matches the stored verify token and returns Meta&apos;s challenge.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
