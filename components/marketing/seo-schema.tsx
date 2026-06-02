import { getAppUrl } from "@/lib/config";
import { CHATDORA_CONTACT_EMAIL, CHATDORA_SUPPORT_PHONE } from "@/lib/contact";
import { FREE_MONTHLY_MESSAGE_LIMIT, PLUS_PLAN_PRICE_INR } from "@/lib/plans";

export function SeoSchema() {
  const appUrl = getAppUrl().replace(/\/$/, "");

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: "ChatDora",
        url: appUrl,
        logo: `${appUrl}/dora-logo.png`,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: CHATDORA_CONTACT_EMAIL,
            telephone: CHATDORA_SUPPORT_PHONE.replace(/\s+/g, "-"),
            availableLanguage: ["English", "Hindi"]
          }
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        url: appUrl,
        name: "ChatDora",
        publisher: {
          "@id": `${appUrl}/#organization`
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${appUrl}/?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${appUrl}/#software`,
        name: "ChatDora",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android, iOS, Windows, macOS",
        url: appUrl,
        image: `${appUrl}/dora-logo.png`,
        description:
          "ChatDora is a WhatsApp bot platform for local businesses with AI auto replies, FAQ automation, lead capture, contact management, and WhatsApp connection tools.",
        offers: [
          {
            "@type": "Offer",
            price: "0",
            priceCurrency: "INR",
            name: "ChatDora Free"
          },
          {
            "@type": "Offer",
            price: String(PLUS_PLAN_PRICE_INR),
            priceCurrency: "INR",
            name: "ChatDora Plus"
          }
        ],
        featureList: [
          "WhatsApp bot for business",
          "AI WhatsApp auto replies",
          "FAQ bot training",
          "Lead capture from WhatsApp chats",
          "CRM-style contact dashboard",
          `Free plan with up to ${FREE_MONTHLY_MESSAGE_LIMIT} messages per month`
        ]
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
