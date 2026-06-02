import type { Metadata } from "next";
import { Mail, MapPinned, MessageCircleQuestion, Phone } from "lucide-react";

import { HelpForm } from "@/components/marketing/help-form";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHATDORA_CONTACT_EMAIL,
  CHATDORA_DOMAIN,
  CHATDORA_SUPPORT_HOURS,
  CHATDORA_SUPPORT_PHONE,
  CHATDORA_SUPPORT_PHONE_RAW,
  CHATDORA_WEBSITE,
  getChatDoraMailtoLink
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us | ChatDora",
  description: "Contact ChatDora for sales, support, legal, billing, and general product questions.",
  alternates: {
    canonical: "/contact-us"
  }
};

const contactCards = [
  {
    title: "Email",
    description: "Best for support, billing, and general questions.",
    icon: Mail,
    value: CHATDORA_CONTACT_EMAIL,
    href: getChatDoraMailtoLink("ChatDora Inquiry")
  },
  {
    title: "Phone",
    description: "Call us for urgent account or onboarding help.",
    icon: Phone,
    value: CHATDORA_SUPPORT_PHONE,
    href: `tel:${CHATDORA_SUPPORT_PHONE_RAW}`
  },
  {
    title: "Website",
    description: "Main public website and legal policy home.",
    icon: MapPinned,
    value: CHATDORA_DOMAIN,
    href: CHATDORA_WEBSITE
  },
  {
    title: "Help Desk",
    description: "Use the quick form below to report any website issue.",
    icon: MessageCircleQuestion,
    value: "Open support form",
    href: "#help-form"
  }
];

export default function ContactUsPage() {
  return (
    <PublicPageShell
      badge="ChatDora Support"
      title="Contact Us"
      description="Reach ChatDora for product questions, billing support, legal requests, onboarding help, or any issue you found on the website."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {contactCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={item.href}
                  className="text-sm font-medium text-primary underline-offset-4 transition hover:underline"
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {item.value}
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Details</CardTitle>
          <CardDescription>ChatDora support channels and response expectations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
          <p>Primary website: {CHATDORA_WEBSITE}</p>
          <p>Public support email: {CHATDORA_CONTACT_EMAIL}</p>
          <p>Public support phone: {CHATDORA_SUPPORT_PHONE}</p>
          <p>Support hours: {CHATDORA_SUPPORT_HOURS}</p>
        </CardContent>
      </Card>

      <div id="help-form">
        <HelpForm />
      </div>
    </PublicPageShell>
  );
}
