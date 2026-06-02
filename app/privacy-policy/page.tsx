import type { Metadata } from "next";

import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHATDORA_CONTACT_EMAIL, CHATDORA_SUPPORT_PHONE, CHATDORA_WEBSITE } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy | ChatDora",
  description: "Privacy policy for ChatDora covering website usage, dashboard data, WhatsApp connection data, AI processing, and support requests.",
  alternates: {
    canonical: "/privacy-policy"
  }
};

const sections = [
  {
    title: "1. Scope",
    body: [
      "This Privacy Policy explains how ChatDora collects, uses, stores, shares, and protects information when you use the ChatDora website, dashboard, WhatsApp connection features, AI-assisted reply tools, support channels, and related services.",
      `This policy applies to activity on ${CHATDORA_WEBSITE} and related product workflows.`
    ]
  },
  {
    title: "2. Information We Collect",
    body: [
      "We may collect your name, email address, phone number, login details, billing information, account metadata, and business profile information.",
      "We may collect your FAQs, knowledge base content, support messages, lead records, contact records, dashboard settings, and configuration choices.",
      "We may collect WhatsApp-related connection details such as connection mode, QR session status, technical identifiers, sync state, connection timestamps, and limited message metadata needed to operate the service.",
      "We may collect recent customer conversations, bot replies, troubleshooting details, and help-form submissions that you or your users send through the service."
    ]
  },
  {
    title: "3. How We Use Information",
    body: [
      "We use information to create and manage accounts, process subscriptions, authenticate access, run the dashboard, connect WhatsApp numbers, generate AI-assisted replies, detect leads, deliver support, and improve service reliability.",
      "We may use technical logs, connection status data, and support information to diagnose bugs, investigate failures, prevent abuse, and secure the platform.",
      "We may use your contact details to respond to help requests, product questions, legal requests, and transactional notices."
    ]
  },
  {
    title: "4. AI and Automated Processing",
    body: [
      "If AI features are enabled, message content, FAQ data, business details, and related context may be processed by third-party AI providers so ChatDora can generate or improve replies.",
      "AI processing may involve routing to fallback providers where necessary for continuity or quality control.",
      "You are responsible for deciding what data you send through AI-assisted workflows and for avoiding unnecessary sensitive personal information where possible."
    ]
  },
  {
    title: "5. WhatsApp and Third-Party Providers",
    body: [
      "ChatDora may share necessary data with Meta, WhatsApp, hosting vendors, email providers, database providers, analytics or infrastructure vendors, and QR or session-handling technology providers as needed to deliver the service.",
      "Those providers may process information under their own terms and privacy rules. We do not control all third-party processing once data enters their systems.",
      "Third-party services may be located in different jurisdictions than you."
    ]
  },
  {
    title: "6. Help Requests and Contact Forms",
    body: [
      "When you use the ChatDora help form or contact channels, we may collect your name, email address, page reference, issue description, and any additional information you choose to include.",
      "We use this information to answer your request, troubleshoot your issue, maintain support history, and improve the service experience."
    ]
  },
  {
    title: "7. Data Retention",
    body: [
      "We retain information for as long as reasonably necessary to operate the service, maintain security, comply with legal obligations, resolve disputes, and enforce agreements.",
      "Operational message history may be limited, trimmed, deduplicated, or deleted on a rolling basis rather than stored forever.",
      "Support requests, billing records, and key account data may be retained longer where reasonably needed for legitimate business, legal, fraud-prevention, or compliance purposes."
    ]
  },
  {
    title: "8. Security",
    body: [
      "We use reasonable administrative, technical, and operational safeguards intended to protect the information we store.",
      "No method of transmission, storage, or online service is fully secure, and we cannot guarantee absolute security, perfect availability, or complete prevention of unauthorized access."
    ]
  },
  {
    title: "9. Your Responsibilities",
    body: [
      "You are responsible for ensuring that your collection and use of customer information through ChatDora is lawful and properly disclosed to your customers.",
      "You should only upload or process data through ChatDora when you have the right to do so and when the data is appropriate for your business workflow."
    ]
  },
  {
    title: "10. Your Choices",
    body: [
      "You may update certain account and business information from the dashboard.",
      "You may stop using ChatDora at any time, but some information may remain in backups, logs, support archives, billing records, or compliance records for legitimate business reasons."
    ]
  },
  {
    title: "11. Children's Privacy",
    body: [
      "ChatDora is not directed to children, and we do not knowingly provide the service for use by children without appropriate legal authority.",
      "If you believe a child has provided personal data through the service inappropriately, contact us so we can review the request."
    ]
  },
  {
    title: "12. International and Legal Disclosures",
    body: [
      "We may disclose information where required by law, regulation, court order, lawful request, fraud investigation, security need, or to protect the rights, safety, or property of ChatDora, our users, or others.",
      "If ChatDora is involved in a merger, acquisition, restructuring, financing, or asset transfer, information may be transferred as part of that transaction subject to applicable law."
    ]
  },
  {
    title: "13. Policy Changes",
    body: [
      "We may update this Privacy Policy from time to time to reflect product, legal, operational, or vendor changes.",
      "The revised version becomes effective when posted on the website unless we state a different effective date."
    ]
  },
  {
    title: "14. Contact",
    body: [
      `For privacy questions, support requests, or data-related concerns, email ${CHATDORA_CONTACT_EMAIL}, call ${CHATDORA_SUPPORT_PHONE}, or visit ${CHATDORA_WEBSITE}.`
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell
      badge="ChatDora Legal"
      title="Privacy Policy"
      description="This policy explains what ChatDora collects, how it is used, when it is shared, and how support, WhatsApp, QR, and AI workflows affect your data."
    >
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Effective date: June 2, 2026</p>
        <p>This policy is intended for operational transparency and does not replace advice from a lawyer familiar with your exact jurisdiction and business model.</p>
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
