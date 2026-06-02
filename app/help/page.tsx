import type { Metadata } from "next";

import { HelpForm } from "@/components/marketing/help-form";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHATDORA_CONTACT_EMAIL, CHATDORA_SUPPORT_PHONE, getChatDoraMailtoLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Help | ChatDora",
  description: "Send a small support query to ChatDora if you found an issue on the website or need setup help.",
  alternates: {
    canonical: "/help"
  }
};

export default function HelpPage() {
  return (
    <PublicPageShell
      badge="ChatDora Help"
      title="Need Help?"
      description="Use this short form to report a bug, share a website issue, ask for onboarding help, or request a reply from the ChatDora team."
    >
      <HelpForm compact />

      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Reach Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
          <p>
            Email:{" "}
            <a href={getChatDoraMailtoLink("ChatDora Support Request")} className="text-primary underline-offset-4 hover:underline">
              {CHATDORA_CONTACT_EMAIL}
            </a>
          </p>
          <p>Phone: {CHATDORA_SUPPORT_PHONE}</p>
          <p>The help form sends your issue directly to the ChatDora support inbox so the team can reply by email.</p>
        </CardContent>
      </Card>
    </PublicPageShell>
  );
}
