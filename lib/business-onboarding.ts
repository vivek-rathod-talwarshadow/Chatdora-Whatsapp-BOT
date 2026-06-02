import type { Business } from "@/lib/types";

type BusinessProfileField =
  | "business_name"
  | "category"
  | "owner_name"
  | "phone"
  | "email"
  | "website"
  | "instagram"
  | "opening_hours"
  | "address"
  | "services"
  | "short_description"
  | "default_fallback_message"
  | "ai_fallback_message";

type BusinessProfileLike = Partial<Pick<Business, BusinessProfileField>> | null;

const trackedFields: Array<{ key: BusinessProfileField; label: string; required?: boolean }> = [
  { key: "business_name", label: "Business name", required: true },
  { key: "category", label: "Category", required: true },
  { key: "owner_name", label: "Owner name" },
  { key: "phone", label: "Phone", required: true },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "instagram", label: "Instagram" },
  { key: "opening_hours", label: "Opening hours", required: true },
  { key: "address", label: "Address", required: true },
  { key: "services", label: "Services", required: true },
  { key: "short_description", label: "Short description", required: true },
  { key: "default_fallback_message", label: "Default fallback message", required: true },
  { key: "ai_fallback_message", label: "AI fallback message" }
];

const overviewReadyFields: BusinessProfileField[] = [
  "business_name",
  "category",
  "phone",
  "opening_hours",
  "services",
  "short_description"
];

function hasValue(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export function getBusinessProfileCompletion(business: BusinessProfileLike) {
  const completedFields = trackedFields.filter((field) => hasValue(business?.[field.key]));
  const missingFields = trackedFields.filter((field) => !hasValue(business?.[field.key]));
  const requiredFields = trackedFields.filter((field) => field.required);
  const completedRequiredFields = requiredFields.filter((field) => hasValue(business?.[field.key]));
  const overviewReadyCount = overviewReadyFields.filter((field) => hasValue(business?.[field])).length;

  return {
    totalFields: trackedFields.length,
    completedCount: completedFields.length,
    percent: Math.round((completedFields.length / trackedFields.length) * 100),
    requiredTotal: requiredFields.length,
    requiredCompletedCount: completedRequiredFields.length,
    requiredPercent: Math.round((completedRequiredFields.length / requiredFields.length) * 100),
    overviewReadyCount,
    overviewReadyTotal: overviewReadyFields.length,
    isReadyForOverview: overviewReadyCount === overviewReadyFields.length,
    completedFields,
    missingFields
  };
}

export function getSetupJourneyStatus(business: BusinessProfileLike) {
  const summary = getBusinessProfileCompletion(business);

  return [
    {
      href: "/dashboard/business",
      label: "Add business details",
      description: "Tell ChatDora who you are, what you sell, and when customers can reach you.",
      done: summary.requiredCompletedCount === summary.requiredTotal,
      active: summary.requiredCompletedCount !== summary.requiredTotal
    },
    {
      href: "/dashboard/faqs",
      label: "Add FAQs",
      description: "Save your most common customer questions so replies stay fast and accurate.",
      done: false,
      active: summary.requiredCompletedCount === summary.requiredTotal
    },
    {
      href: "/dashboard/whatsapp",
      label: "Connect WhatsApp",
      description: "Turn on the channel that receives customer messages and sends replies.",
      done: false,
      active: false
    },
    {
      href: "/dashboard/test-bot",
      label: "Test the bot",
      description: "Send a sample message and confirm the reply sounds right before going live.",
      done: false,
      active: false
    }
  ];
}
