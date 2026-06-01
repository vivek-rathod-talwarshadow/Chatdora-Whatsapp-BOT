import type { Metadata } from "next";
import Link from "next/link";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PublicFooter } from "@/components/marketing/public-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms & Conditions | ChatDora",
  description: "Terms and conditions for using ChatDora AI WhatsApp Bot."
};

const sections = [
  {
    title: "1. About ChatDora",
    body: [
      "ChatDora is a software product that helps businesses automate WhatsApp support using FAQs, AI-generated replies, lead capture, message routing, QR-based WhatsApp connection, and optional official WhatsApp Cloud API setup.",
      "These Terms & Conditions govern your access to and use of the ChatDora website, dashboard, APIs, and related services."
    ]
  },
  {
    title: "2. Acceptance of Terms",
    body: [
      "By creating an account, connecting a WhatsApp number, or using ChatDora, you agree to these Terms & Conditions and our Privacy Policy.",
      "If you use ChatDora on behalf of a business, organization, or team, you confirm that you have authority to bind that entity to these terms."
    ]
  },
  {
    title: "3. Eligibility and Account Responsibility",
    body: [
      "You must provide accurate account and business information and keep it up to date.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      "You must promptly notify us if you believe your account or WhatsApp connection has been accessed without authorization."
    ]
  },
  {
    title: "4. Service Features and Connection Modes",
    body: [
      "ChatDora may offer QR Login Mode through a WhatsApp engine and Official API Mode through Meta WhatsApp Cloud API.",
      "QR Login Mode is designed for quick setup and may require re-scan, re-authentication, reconnection, or manual intervention if WhatsApp Web sessions expire or are logged out.",
      "Official API Mode depends on Meta infrastructure, configuration, approval, and availability.",
      "Some features may behave differently in local development, public deployment, or test environments."
    ]
  },
  {
    title: "5. AI Replies and Automation",
    body: [
      "ChatDora may generate replies using your configured FAQs, business profile, lead rules, and connected AI providers.",
      "AI replies are assistive outputs only. They may be incomplete, inaccurate, delayed, repetitive, or unsuitable for your use case.",
      "You remain fully responsible for reviewing, approving, supervising, and legally using any replies sent through your WhatsApp-connected business workflows.",
      "You should not rely on ChatDora for medical, legal, financial, emergency, or other high-risk advice without appropriate human oversight."
    ]
  },
  {
    title: "6. Your Content and Responsibilities",
    body: [
      "You retain responsibility for all content you upload, configure, sync, or transmit through ChatDora, including FAQs, business descriptions, fallback messages, contact information, connected WhatsApp data, and customer communications.",
      "You agree not to use ChatDora for spam, phishing, fraud, impersonation, harassment, unlawful surveillance, malware distribution, copyright infringement, or any illegal or abusive purpose.",
      "You are responsible for ensuring your use of WhatsApp, Meta services, and customer data complies with applicable laws, privacy requirements, consent standards, and platform rules in your jurisdiction."
    ]
  },
  {
    title: "7. WhatsApp, Meta, and Third-Party Services",
    body: [
      "ChatDora integrates with third-party services such as WhatsApp, Meta, AI providers, hosting providers, and database infrastructure.",
      "We do not control third-party outages, account restrictions, policy decisions, pricing changes, API changes, or removals.",
      "Your use of WhatsApp, Meta, and any third-party provider remains subject to their own terms, policies, and technical limitations."
    ]
  },
  {
    title: "8. Subscription, Plans, and Access",
    body: [
      "Any plan names, pricing, usage limits, or feature labels shown on the website or dashboard may be updated, changed, restricted, or discontinued.",
      "We may modify or remove features, quotas, connection modes, storage behavior, or account access as the product evolves.",
      "Trial access, free access, and beta functionality may be limited, withdrawn, or offered without uptime commitments."
    ]
  },
  {
    title: "9. Data Storage and Retention",
    body: [
      "ChatDora stores operational data needed to provide the product, including business settings, FAQs, leads, and recent message history.",
      "Recent message logs may be retained only for a limited rolling window rather than permanently.",
      "AI provider logs may be limited, disabled, reduced, or removed to control storage usage and improve operational efficiency.",
      "We may add automated cleanup, deduplication, trimming, or archiving policies as part of normal product maintenance."
    ]
  },
  {
    title: "10. Availability and Support",
    body: [
      "ChatDora is provided on an as-available basis. We do not guarantee uninterrupted access, guaranteed delivery, guaranteed message sync, guaranteed QR session persistence, or guaranteed compatibility with every browser, phone, or network environment.",
      "Temporary slowdowns, sync delays, session drops, provider failures, and maintenance windows may occur."
    ]
  },
  {
    title: "11. Suspension and Termination",
    body: [
      "We may suspend, limit, or terminate access if we reasonably believe your use is abusive, unlawful, harmful, insecure, or creates risk for the platform, third-party providers, or other users.",
      "You may stop using ChatDora at any time, but obligations relating to prior usage, liability limits, and compliance responsibilities survive termination where applicable."
    ]
  },
  {
    title: "12. Intellectual Property",
    body: [
      "The ChatDora product, software, branding, interface design, original text, and service structure remain the property of ChatDora or its licensors.",
      "These terms do not transfer ownership of the product to you, except that your own uploaded business content remains yours subject to the rights necessary for us to operate the service."
    ]
  },
  {
    title: "13. Disclaimer of Warranties",
    body: [
      "ChatDora is provided without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted availability, or error-free performance.",
      "We do not warrant that AI replies, lead detection, FAQ matching, QR sessions, or external integrations will always function as expected."
    ]
  },
  {
    title: "14. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, ChatDora and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or lost-profit damages arising out of or related to your use of the service.",
      "This includes loss caused by message errors, automation mistakes, third-party platform issues, blocked WhatsApp accounts, provider outages, customer disputes, missed leads, or configuration mistakes.",
      "Your sole remedy for dissatisfaction with the service is to stop using it."
    ]
  },
  {
    title: "15. Changes to These Terms",
    body: [
      "We may update these Terms & Conditions from time to time. Updated versions become effective when posted on this website unless stated otherwise.",
      "Continuing to use ChatDora after updates means you accept the revised terms."
    ]
  },
  {
    title: "16. Contact",
    body: ["For account, legal, or policy questions, contact us at contactus@chatdora.in or call 7622858519."]
  }
];

export default function TermsPage() {
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
                <h1 className="font-[var(--font-sora)] text-4xl font-semibold tracking-tight md:text-5xl">Terms & Conditions</h1>
                <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                  These terms explain how ChatDora may be used across dashboard access, WhatsApp QR login, official Meta API mode, FAQ automation, AI fallback replies, leads, and recent message history.
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
