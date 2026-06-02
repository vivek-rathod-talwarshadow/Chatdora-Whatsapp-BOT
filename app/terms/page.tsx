import type { Metadata } from "next";

import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHATDORA_CONTACT_EMAIL, CHATDORA_SUPPORT_PHONE, CHATDORA_WEBSITE } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms & Conditions | ChatDora",
  description: "Terms and conditions for ChatDora, including beta service terms, QR connection limitations, and no-refund billing rules.",
  alternates: {
    canonical: "/terms"
  }
};

const sections = [
  {
    title: "1. Agreement and Scope",
    body: [
      "These Terms & Conditions apply to your access to and use of ChatDora, including chatdora.in, the ChatDora dashboard, connected APIs, WhatsApp connection tools, AI reply tools, QR login workflows, lead capture, contact records, and any related support channels.",
      "By visiting the website, creating an account, buying a subscription, connecting a WhatsApp number, or sending a help request, you agree to these terms and the ChatDora Privacy Policy.",
      "If you use ChatDora for a company, client, agency, or other organization, you confirm that you have authority to bind that entity to these terms."
    ]
  },
  {
    title: "2. Beta Product Notice",
    body: [
      "ChatDora is a fast-evolving software product and some features may be marked, treated, or operated as beta, trial, experimental, preview, early access, or limited-release functionality.",
      "Beta and evolving features may contain bugs, interruptions, delays, breaking changes, incomplete documentation, temporary removals, or compatibility issues.",
      "You accept that beta and evolving product behavior is part of the service and does not create a refund right, service credit right, uptime guarantee, or liability claim against ChatDora."
    ]
  },
  {
    title: "3. QR Login, WhatsApp Web, and Connection Risk",
    body: [
      "ChatDora may offer a QR-based WhatsApp login mode that depends on WhatsApp Web style sessions, browser state, linked-device rules, phone connectivity, Meta or WhatsApp behavior, and third-party engine availability.",
      "QR connection mode may stop working, disconnect, require re-scan, expire, fail to sync, show stale status, or become unavailable without notice. ChatDora does not guarantee that QR mode will always work, stay connected, or remain supported.",
      "You are solely responsible for monitoring your connection status, maintaining access to the linked phone and WhatsApp account, and choosing whether QR mode is suitable for your business."
    ]
  },
  {
    title: "4. Official API and Third-Party Dependencies",
    body: [
      "Some ChatDora functionality depends on third-party services, including Meta, WhatsApp, hosting providers, AI model providers, email providers, and database or infrastructure vendors.",
      "We do not control third-party rules, approvals, suspensions, outages, latency, account reviews, pricing changes, or technical changes. Those third-party events may affect your use of ChatDora.",
      "Your use of any integrated third-party product remains subject to that provider's own terms, policies, and operational limits."
    ]
  },
  {
    title: "5. Account, Access, and Security",
    body: [
      "You must provide accurate registration, billing, and business information and keep it current.",
      "You are responsible for your login credentials, linked devices, connected phone numbers, team access, and all activity occurring through your account.",
      "You must promptly notify ChatDora if you suspect unauthorized access, compromised credentials, or misuse of a connected WhatsApp account."
    ]
  },
  {
    title: "6. Customer Content and Legal Responsibility",
    body: [
      "You remain fully responsible for all content, FAQs, prompts, business information, automated replies, phone numbers, customer records, support messages, and other material you upload, configure, store, or transmit through ChatDora.",
      "You are responsible for obtaining all legally required notices, permissions, and consents for your messaging and automation activity, including consent standards required under privacy, marketing, telecom, and consumer laws that apply to your business.",
      "You may not use ChatDora for spam, fraud, impersonation, phishing, harassment, unlawful scraping, infringement, malware, abusive surveillance, or any illegal, deceptive, or harmful activity."
    ]
  },
  {
    title: "7. AI Output Disclaimer",
    body: [
      "ChatDora may generate or assist with replies using AI systems, your business profile, your FAQs, recent message history, and connected provider tools.",
      "AI output may be inaccurate, incomplete, delayed, repetitive, irrelevant, or unsafe for a particular business situation. You are solely responsible for reviewing and deciding how to use AI-generated content.",
      "ChatDora must not be relied on as medical, legal, financial, tax, emergency, compliance, or other high-risk advice."
    ]
  },
  {
    title: "8. Plans, Billing, and Strict No-Refund Policy",
    body: [
      "All subscriptions, setup fees, renewals, add-ons, and other payments made to ChatDora are final and non-refundable to the maximum extent permitted by applicable law.",
      "No refunds, chargeback entitlements, partial credits, or prorated reversals will be issued because of beta limitations, QR issues, downtime, feature changes, dissatisfaction, limited usage, accidental purchase, failure to cancel before renewal, third-party restrictions, or incompatibility with your workflow.",
      "You are responsible for evaluating the service before purchase, including whether QR mode, automation behavior, AI features, and third-party integrations are acceptable for your business use case."
    ]
  },
  {
    title: "9. Feature Changes and Service Availability",
    body: [
      "ChatDora may add, remove, pause, replace, limit, rename, or discontinue any feature, integration, plan, quota, dashboard section, or workflow at any time.",
      "The service is provided on an as-available and as-is basis, without any guarantee of uninterrupted access, message delivery, sync continuity, response time, compatibility, or error-free operation.",
      "Maintenance windows, bugs, ISP failures, hosting failures, provider issues, blocked sessions, device issues, or policy actions may interrupt the service."
    ]
  },
  {
    title: "10. Suspension, Termination, and Abuse Control",
    body: [
      "ChatDora may suspend, restrict, remove, or terminate any account, workspace, connected number, or feature if we believe it creates security, legal, abuse, reputation, operational, payment, or third-party platform risk.",
      "We may do this with or without advance notice where reasonably necessary to protect the platform, our providers, or other users.",
      "Termination or suspension does not create a refund obligation."
    ]
  },
  {
    title: "11. Intellectual Property and Feedback",
    body: [
      "ChatDora and its software, design, brand elements, text, dashboards, workflows, and related materials are owned by ChatDora or its licensors.",
      "You keep ownership of your business content, but you grant ChatDora the rights needed to host, process, transmit, display, back up, and improve the service using that content.",
      "If you provide feedback, suggestions, or product ideas, ChatDora may use them without compensation or restriction."
    ]
  },
  {
    title: "12. Indemnity",
    body: [
      "You agree to defend, indemnify, and hold harmless ChatDora, its operators, affiliates, contractors, and service providers from claims, losses, liabilities, damages, costs, and expenses arising from your content, your business activity, your customer messaging, your legal compliance failures, or your misuse of the service.",
      "This includes disputes involving consent, advertising, promotions, consumer complaints, customer losses, WhatsApp account action, IP claims, privacy complaints, or unlawful communications."
    ]
  },
  {
    title: "13. Warranty Disclaimer",
    body: [
      "To the maximum extent permitted by law, ChatDora disclaims all warranties, express, implied, statutory, or otherwise, including merchantability, fitness for a particular purpose, title, non-infringement, uptime, performance, and availability warranties.",
      "We do not warrant that ChatDora will meet your business expectations, increase revenue, avoid losses, stay compatible with every device, or remain continuously available."
    ]
  },
  {
    title: "14. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, ChatDora and its operators will not be liable for any indirect, incidental, special, exemplary, punitive, or consequential damages, including lost revenue, lost profits, lost goodwill, lost data, missed leads, customer disputes, blocked numbers, or business interruption.",
      "If ChatDora is ever found liable despite these terms, the maximum aggregate liability will be limited to the amount you paid to ChatDora for the service during the 30 days immediately preceding the event giving rise to the claim, or INR 1,000, whichever is lower.",
      "Your exclusive remedy for dissatisfaction with the service is to stop using it."
    ]
  },
  {
    title: "15. Governing Law and Jurisdiction",
    body: [
      "These terms are governed by the laws of India, without regard to conflict-of-law rules.",
      "Any dispute, claim, or proceeding arising out of or relating to ChatDora or these terms will be subject to the exclusive jurisdiction of the courts located in Gujarat, India, unless applicable law requires otherwise."
    ]
  },
  {
    title: "16. Changes to Terms",
    body: [
      "We may update these Terms & Conditions at any time by posting a revised version on the website.",
      "Your continued use of ChatDora after an updated version is posted means you accept the revised terms."
    ]
  },
  {
    title: "17. Contact",
    body: [
      `For legal, billing, or account matters, contact ChatDora at ${CHATDORA_CONTACT_EMAIL}, call ${CHATDORA_SUPPORT_PHONE}, or visit ${CHATDORA_WEBSITE}.`
    ]
  }
];

export default function TermsPage() {
  return (
    <PublicPageShell
      badge="ChatDora Legal"
      title="Terms & Conditions"
      description="These terms define the rules for using ChatDora, including beta feature usage, QR connection limits, strict no-refund billing, liability limits, and legal responsibilities."
    >
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Effective date: June 2, 2026</p>
        <p>These terms are written to be product-specific and defensive, but they are not a substitute for jurisdiction-specific legal advice.</p>
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
    </PublicPageShell>
  );
}
