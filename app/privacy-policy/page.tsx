import type { Metadata } from "next";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PublicFooter } from "@/components/marketing/public-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | ChatDora",
  description: "Privacy policy for ChatDora AI WhatsApp Bot."
};

const sections = [
  {
    title: "1. Overview",
    body: [
      "This Privacy Policy explains how ChatDora collects, uses, stores, and protects information when you use our website, dashboard, WhatsApp connection features, AI reply features, and related services.",
      "ChatDora is built to help businesses automate WhatsApp FAQ replies, collect leads, and manage customer conversations more efficiently."
    ]
  },
  {
    title: "2. Information We Collect",
    body: [
      "We may collect account information such as your name, email address, login credentials, and profile details.",
      "We may collect business information such as business name, category, services, support details, fallback messages, contact information, and operational settings.",
      "We may collect FAQ and bot configuration data you enter into the dashboard.",
      "We may collect WhatsApp connection data, including connection mode, workspace/session identifiers, status, recent sync metadata, and technical connection information required to operate the service.",
      "We may collect recent customer message logs, bot replies, lead records, and limited message context needed for reply generation and dashboard visibility."
    ]
  },
  {
    title: "3. How We Use Information",
    body: [
      "We use collected information to provide the dashboard, authenticate users, connect WhatsApp accounts, generate replies, store FAQs, detect leads, and display operational status.",
      "We use business profile details, FAQ data, and recent conversation context to generate more relevant automated replies.",
      "We may use technical metadata to improve service reliability, prevent abuse, troubleshoot failures, and maintain system health."
    ]
  },
  {
    title: "4. AI and Message Processing",
    body: [
      "When AI reply features are enabled, some message content and related business context may be sent to third-party AI providers to generate or improve replies.",
      "ChatDora may route requests across multiple AI providers for fallback purposes when one provider fails, times out, or returns unusable output.",
      "You are responsible for deciding what information is appropriate to send through AI-assisted workflows and for avoiding unnecessary sensitive personal information where possible."
    ]
  },
  {
    title: "5. WhatsApp Connection Modes",
    body: [
      "In QR Login Mode, ChatDora may exchange session and conversation data with an external WhatsApp engine used to establish and maintain the connected WhatsApp session.",
      "In Official API Mode, ChatDora may exchange data with Meta WhatsApp Cloud API and related Meta infrastructure.",
      "These integrations are necessary to connect, receive, route, and reply to WhatsApp messages through the selected connection mode."
    ]
  },
  {
    title: "6. Leads and CRM Data",
    body: [
      "When customer messages indicate buying intent, ChatDora may create lead records containing customer phone number, customer name when available, interest category, and the relevant message content.",
      "Lead records are stored to help businesses follow up on customer inquiries and may be retained longer than operational message logs because they have ongoing CRM value."
    ]
  },
  {
    title: "7. Data Retention",
    body: [
      "ChatDora keeps only recent message logs needed for current dashboard operations and troubleshooting rather than storing unlimited chat history in the primary database.",
      "Operational message history may be trimmed automatically on a rolling basis.",
      "AI provider log retention may be disabled or heavily limited to reduce storage usage.",
      "Duplicate lead or message records may be removed automatically as part of system cleanup and deduplication routines."
    ]
  },
  {
    title: "8. Third-Party Services",
    body: [
      "We may rely on third-party service providers such as Supabase for database and authentication services, AI providers for reply generation, Meta for official WhatsApp API functionality, hosting providers for deployment, and a WhatsApp engine for QR-based connections.",
      "These providers may process information as needed to deliver their part of the service.",
      "Your use of those integrated services may also be subject to their own privacy policies and terms."
    ]
  },
  {
    title: "9. Security",
    body: [
      "We use reasonable technical and operational measures to help protect account access, service credentials, and stored information.",
      "However, no system is completely secure, and we cannot guarantee absolute security, uninterrupted availability, or complete protection against unauthorized access, misuse, or third-party failures."
    ]
  },
  {
    title: "10. Your Responsibilities",
    body: [
      "You are responsible for configuring your business data correctly, using lawful contact and messaging practices, and obtaining any permissions or consents required to communicate with customers.",
      "You should avoid storing or transmitting unnecessary sensitive data through the service unless you are satisfied that such use is legally appropriate for your business."
    ]
  },
  {
    title: "11. Your Choices",
    body: [
      "You may update business settings, FAQs, bot behavior, and connection choices from the dashboard.",
      "You may choose whether to use QR Login Mode or Official API Mode where available.",
      "You may stop using the service at any time, though some retained operational or CRM records may remain for legitimate business, security, or compliance reasons."
    ]
  },
  {
    title: "12. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect product changes, legal requirements, or operational needs.",
      "Updated versions become effective when posted on this site unless stated otherwise."
    ]
  },
  {
    title: "13. Contact",
    body: ["For privacy questions or requests related to this policy, contact us at contactus@chatdora.in or call 7622858519."]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-hero-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6">
        <header className="flex items-center justify-between rounded-[2rem] border border-border/60 bg-white/80 p-4 shadow-card backdrop-blur dark:bg-card/80">
          <AppLogo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
              Back to home
            </Link>
          </div>
        </header>

        <section className="flex-1 py-10">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4 rounded-[2rem] border border-border/70 bg-card/80 p-7 shadow-card">
              <Badge className="w-fit">ChatDora Legal</Badge>
              <div className="space-y-3">
                <h1 className="font-[var(--font-sora)] text-4xl font-semibold tracking-tight md:text-5xl">Privacy Policy</h1>
                <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                  This policy covers how ChatDora handles account data, business settings, recent message logs, lead records, QR session metadata, and AI-assisted reply processing.
                </p>
                <p className="text-sm text-muted-foreground">Effective date: May 29, 2026</p>
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <Card key={section.title}>
                  <CardHeader>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <PublicFooter />
      </div>
    </main>
  );
}
