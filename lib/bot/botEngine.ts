import { callAIWithFallback } from "@/lib/ai/modelRouter";
import { getPlanSummaryForBusiness, hasInboundReceiptTable } from "@/lib/billing";
import { matchFAQ } from "@/lib/bot/faqMatcher";
import { detectLeadIntent, shouldTriggerHumanHandoff } from "@/lib/bot/leadDetector";
import { cleanupBusinessStorage } from "@/lib/storage/cleanup";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Business } from "@/lib/types";
import type { WhatsAppConnectionMode } from "@/lib/types";
import { getPausedCustomerPhones } from "@/lib/whatsapp/connections";
import { sendWhatsAppReply } from "@/lib/whatsapp/sendReply";

const SYSTEM_PROMPT =
  "You are ChatDora AI WhatsApp assistant for a local business. Answer customers using only the provided business profile and FAQs. Keep replies short, helpful, and WhatsApp-friendly. Never invent details. If the answer is not available, ask the customer to share name and requirement and say the team will reply shortly.";

const GREETING_MESSAGES = new Set([
  "hi",
  "hii",
  "hiii",
  "hello",
  "hey",
  "heyy",
  "yo",
  "sup",
  "hola",
  "namaste"
]);

const WEBSITE_CONTACT_PATTERNS = [
  "what is your website",
  "whats your website",
  "what's your website",
  "website link",
  "web address",
  "site link",
  "company website",
  "business website",
  "your website",
  "domain"
];

const WEBSITE_SERVICE_PATTERNS = [
  "make website",
  "making website",
  "need website",
  "want website",
  "build website",
  "create website",
  "develop website",
  "website development",
  "website design",
  "make a website",
  "build a website",
  "create a website",
  "develop a website"
];

function hasAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s?]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGreetingMessage(incomingMessage: string) {
  const normalized = normalizeText(incomingMessage);

  if (!normalized) {
    return false;
  }

  if (GREETING_MESSAGES.has(normalized)) {
    return true;
  }

  return normalized.split(" ").every((word) => GREETING_MESSAGES.has(word));
}

function getPrimaryContactNumber(business: Business) {
  return business.phone?.trim() || null;
}

function getPrimaryContactEmail(business: Business) {
  return business.email?.trim() || null;
}

function getPrimaryWebsite(business: Business) {
  return business.website?.trim() || null;
}

function getBusinessContactLine(business: Business) {
  const contactParts = [
    getPrimaryContactNumber(business) ? `call or WhatsApp us on ${getPrimaryContactNumber(business)}` : null,
    getPrimaryContactEmail(business) ? `email us at ${getPrimaryContactEmail(business)}` : null,
    getPrimaryWebsite(business) ? `visit our website ${getPrimaryWebsite(business)}` : null
  ].filter((value): value is string => Boolean(value));

  if (!contactParts.length) {
    return null;
  }

  if (contactParts.length === 1) {
    return `You can also ${contactParts[0]} for more information.`;
  }

  const lastPart = contactParts[contactParts.length - 1];
  const initialParts = contactParts.slice(0, -1);
  return `You can also ${initialParts.join(", ")}, or ${lastPart} for more information.`;
}

function getGreetingReply(business: Business) {
  const contactLine = getBusinessContactLine(business);
  return [
    `* Welcome to ${business.business_name}!`,
    "",
    "Thank you for contacting us :)",
    "We're happy to assist you with any questions regarding our services, pricing, support, or bookings.",
    "",
    ...(contactLine ? [contactLine, ""] : []),
    "How can we help you today?"
  ].join("\n");
}

function getAssistantIdentityReply(business: Business) {
  const contactLine = getBusinessContactLine(business);
  return [
    `* I'm the ${business.business_name} WhatsApp assistant.`,
    ...(contactLine ? [contactLine] : []),
    "How can we assist you today? :)"
  ].join("\n");
}

function getBusinessProfileReply(business: Business, incomingMessage: string) {
  const text = normalizeText(incomingMessage);

  if (isGreetingMessage(incomingMessage)) {
    return getGreetingReply(business);
  }

  if (
    hasAnyKeyword(text, ["excellent", "great", "awesome", "nice", "good", "perfect", "thank you", "thanks", "ok thanks"])
  ) {
    return "Thank you for your message. If you would like details about our services, pricing, or next steps, please let us know.";
  }

  if (
    hasAnyKeyword(text, [
      "what is your name",
      "whats your name",
      "what's your name",
      "your name",
      "bot name",
      "assistant name",
      "who are you"
    ])
  ) {
    return getAssistantIdentityReply(business);
  }

  if (
    hasAnyKeyword(text, [
      "instagram",
      "insta",
      "instagram link",
      "instagram id",
      "instagram page",
      "insta link",
      "insta id"
    ])
  ) {
    if (business.instagram) {
      return `Our Instagram is ${business.instagram}`;
    }
  }

  if (
    hasAnyKeyword(text, WEBSITE_SERVICE_PATTERNS) ||
    (hasAnyKeyword(text, ["website"]) &&
      hasAnyKeyword(text, ["need", "want", "make", "build", "create", "develop", "interested", "looking for"]))
  ) {
    const serviceLine = business.services
      ? `We can help you with ${business.services}.`
      : "We can help you with website and digital service requirements.";

    return `${serviceLine} Please share your name, business type, and what kind of website you need, and our team will get back to you shortly.`;
  }

  if (hasAnyKeyword(text, WEBSITE_CONTACT_PATTERNS)) {
    if (business.website) {
      return `Our website is ${business.website}`;
    }
  }

  if (hasAnyKeyword(text, ["email", "mail id", "email id", "e-mail address", "contact email"])) {
    if (business.email) {
      return `Email: ${business.email}`;
    }
  }

  if (
    hasAnyKeyword(text, [
      "phone number",
      "contact number",
      "mobile number",
      "call number",
      "whatsapp number",
      "your number",
      "support number"
    ])
  ) {
    if (business.phone) {
      return `Phone / WhatsApp: ${business.phone}`;
    }
  }

  if (hasAnyKeyword(text, ["address", "location", "where are you", "where r u", "office", "located"])) {
    if (business.address) {
      return `Our address is ${business.address}`;
    }
  }

  if (
    hasAnyKeyword(text, [
      "timing",
      "timings",
      "opening hour",
      "opening hours",
      "working hour",
      "working hours",
      "weekend time",
      "office hour",
      "office hours",
      "business hours"
    ])
  ) {
    if (business.opening_hours) {
      return `Opening hours: ${business.opening_hours}`;
    }
  }

  if (hasAnyKeyword(text, ["owner", "founder", "who owns this", "business owner"])) {
    if (business.owner_name) {
      return `${business.owner_name} is the founder of ${business.business_name}.`;
    }
  }

  if (
    hasAnyKeyword(text, [
      "i am interested",
      "im interested",
      "interested in your service",
      "interested in service",
      "need your service",
      "want your service",
      "looking for your service",
      "looking for service",
      "need help with website",
      "need help with app",
      "what do you do",
      "what do you offer",
      "what services",
      "which services",
      "service list",
      "about your business",
      "tell me about your business",
      "about chatdora"
    ])
  ) {
    if (
      hasAnyKeyword(text, [
        "i am interested",
        "im interested",
        "interested in your service",
        "interested in service",
        "need your service",
        "want your service",
        "looking for your service",
        "looking for service",
        "need help with website",
        "need help with app"
      ])
    ) {
      const serviceSummary =
        business.services?.trim() || business.short_description?.trim() || "website, app, and digital business services";
      return `Thank you for your interest. We offer ${serviceSummary}. Please share your name and your exact requirement, and our team will contact you shortly.`;
    }

    if (business.short_description) {
      return business.short_description;
    }

    if (business.services) {
      return `We offer ${business.services}`;
    }
  }

  return null;
}

export async function generateBotReply({
  businessId,
  customerPhone,
  customerName,
  incomingMessage,
  sendReply = false,
  persistLogs = true,
  connectionMode = "meta_api",
  forceSendReply = false
}: {
  businessId: string;
  customerPhone: string;
  customerName?: string | null;
  incomingMessage: string;
  sendReply?: boolean;
  persistLogs?: boolean;
  connectionMode?: WhatsAppConnectionMode;
  forceSendReply?: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { data: business } = await supabase.from("businesses").select("*").eq("id", businessId).single();

  if (!business) {
    throw new Error("Business not found");
  }

  const plan = await getPlanSummaryForBusiness({
    businessId,
    userId: business.user_id
  });
  const allowLockedStorageFeatures = plan.isPlus;
  const receiptTableAvailable = await hasInboundReceiptTable();
  const persistMessageLogsForCompatibility = !plan.isPlus && !receiptTableAvailable;

  const [{ data: faqs }, { data: recentMessages }] = await Promise.all([
    allowLockedStorageFeatures
      ? supabase
          .from("faqs")
          .select("*")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("priority", { ascending: false })
      : Promise.resolve({ data: [] }),
    allowLockedStorageFeatures
      ? supabase
          .from("messages")
          .select("*")
          .eq("business_id", businessId)
          .eq("customer_phone", customerPhone)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] })
  ]);

  try {
    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("engine_status")
      .eq("business_id", businessId)
      .maybeSingle();

    const pausedCustomerPhones = new Set(getPausedCustomerPhones(connection?.engine_status));
    if (pausedCustomerPhones.has(customerPhone)) {
      return finalizeBotResponse({
        supabase,
        business,
        customerPhone,
        customerName,
        incomingMessage,
        hasPriorConversation: (recentMessages ?? []).length > 0,
        finalReply: "",
        replySource: "paused",
        sendReply: false,
        persistLogs: persistLogs && (allowLockedStorageFeatures || persistMessageLogsForCompatibility),
        canStoreLeads: allowLockedStorageFeatures,
        connectionMode,
        forceSendReply
      });
    }
  } catch {
    // Fail open: a pause-state lookup problem should never stop the bot entirely.
  }

  if (shouldTriggerHumanHandoff(incomingMessage)) {
    return finalizeBotResponse({
      supabase,
      business,
      customerPhone,
      customerName,
      incomingMessage,
      hasPriorConversation: (recentMessages ?? []).length > 0,
      finalReply: "Sure, our team will connect with you shortly. Please share your name and requirement so we can help you better.",
      replySource: "handoff",
      sendReply,
      persistLogs: persistLogs && (allowLockedStorageFeatures || persistMessageLogsForCompatibility),
      canStoreLeads: allowLockedStorageFeatures,
      connectionMode,
      forceSendReply
    });
  }

  const businessProfileReply = getBusinessProfileReply(business as Business, incomingMessage);
  if (businessProfileReply) {
    return finalizeBotResponse({
      supabase,
      business,
      customerPhone,
      customerName,
      incomingMessage,
      hasPriorConversation: (recentMessages ?? []).length > 0,
      finalReply: businessProfileReply,
      replySource: "faq",
      sendReply,
      persistLogs: persistLogs && (allowLockedStorageFeatures || persistMessageLogsForCompatibility),
      canStoreLeads: allowLockedStorageFeatures,
      connectionMode,
      forceSendReply
    });
  }

  const faqMatch = business.rule_based_first ? matchFAQ(incomingMessage, faqs ?? []) : null;
  if (faqMatch) {
    return finalizeBotResponse({
      supabase,
      business,
      customerPhone,
      customerName,
      incomingMessage,
      hasPriorConversation: (recentMessages ?? []).length > 0,
      finalReply: faqMatch.faq.answer,
      replySource: "faq",
      matchedFaqId: faqMatch.faq.id,
      sendReply,
      persistLogs: persistLogs && (allowLockedStorageFeatures || persistMessageLogsForCompatibility),
      canStoreLeads: allowLockedStorageFeatures,
      connectionMode,
      forceSendReply
    });
  }

  if (!business.ai_enabled) {
    return finalizeBotResponse({
      supabase,
      business,
      customerPhone,
      customerName,
      incomingMessage,
      hasPriorConversation: (recentMessages ?? []).length > 0,
      finalReply:
        business.default_fallback_message ||
        business.ai_fallback_message ||
        "Thanks for your message. Please share your name and requirement, and our team will reply shortly.",
      replySource: "fallback",
      sendReply,
      persistLogs: persistLogs && (allowLockedStorageFeatures || persistMessageLogsForCompatibility),
      canStoreLeads: allowLockedStorageFeatures,
      connectionMode,
      forceSendReply
    });
  }

  const faqContext = (faqs ?? [])
    .slice(0, 20)
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}\nKeywords: ${(faq.keywords ?? []).join(", ")}`)
    .join("\n\n");
  const history = (recentMessages ?? [])
    .reverse()
    .map((message) => `Customer: ${message.incoming_message}\nBot: ${message.bot_reply ?? ""}`)
    .join("\n");

  const aiResult = await callAIWithFallback(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Business name: ${business.business_name}`,
          `Category: ${business.category ?? "N/A"}`,
          `Owner name: ${business.owner_name ?? "N/A"}`,
          `Phone: ${business.phone ?? "N/A"}`,
          `Email: ${business.email ?? "N/A"}`,
          `Address: ${business.address ?? "N/A"}`,
          `Opening hours: ${business.opening_hours ?? "N/A"}`,
          `Website: ${business.website ?? "N/A"}`,
          `Instagram: ${business.instagram ?? "N/A"}`,
          `Services: ${business.services ?? "N/A"}`,
          `Short description: ${business.short_description ?? "N/A"}`,
          `FAQs:\n${faqContext || "No FAQs available."}`,
          `Previous short conversation history:\n${history || "No previous history."}`,
          `Customer message: ${incomingMessage}`,
          "Reply in the same language as the customer. Keep it short and business-like. If unsure, ask for name and requirement."
        ].join("\n\n")
      }
    ],
    {
      businessId: business.id,
      userId: business.user_id,
      temperature: business.ai_temperature,
      maxTokens: business.ai_max_tokens,
      timeoutSeconds: business.ai_timeout_seconds,
      fallbackMessage: business.ai_fallback_message || business.default_fallback_message
    }
  );

  return finalizeBotResponse({
    supabase,
    business,
    customerPhone,
    customerName,
    incomingMessage,
    hasPriorConversation: (recentMessages ?? []).length > 0,
    finalReply: aiResult.reply,
    replySource: aiResult.model ? "ai" : "fallback",
    modelUsed: aiResult.model,
    aiProvider: aiResult.provider,
    sendReply,
    persistLogs: persistLogs && (allowLockedStorageFeatures || persistMessageLogsForCompatibility),
    canStoreLeads: allowLockedStorageFeatures,
    connectionMode,
    forceSendReply
  });
}

async function finalizeBotResponse({
  supabase,
  business,
  customerPhone,
  customerName,
  incomingMessage,
  hasPriorConversation,
  finalReply,
  replySource,
  matchedFaqId,
  modelUsed,
  aiProvider,
  sendReply,
  persistLogs,
  canStoreLeads,
  connectionMode,
  forceSendReply
}: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  business: any;
  customerPhone: string;
  customerName?: string | null;
  incomingMessage: string;
  hasPriorConversation?: boolean;
  finalReply: string;
  replySource: "faq" | "ai" | "fallback" | "handoff" | "paused";
  matchedFaqId?: string;
  modelUsed?: string | null;
  aiProvider?: string | null;
  sendReply?: boolean;
  persistLogs?: boolean;
  canStoreLeads?: boolean;
  connectionMode?: WhatsAppConnectionMode;
  forceSendReply?: boolean;
}) {
  const leadIntent = detectLeadIntent(incomingMessage, { hasPriorConversation });
  const recentSendDuplicateSince = new Date(Date.now() - 90 * 1000).toISOString();
  const recentDuplicateSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  let shouldSendReply = true;

  if (persistLogs) {
    const { data: recentHandledMessage } = await supabase
      .from("messages")
      .select("id, bot_reply")
      .eq("business_id", business.id)
      .eq("customer_phone", customerPhone)
      .eq("incoming_message", incomingMessage)
      .gte("created_at", recentSendDuplicateSince)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentHandledMessage?.id && !forceSendReply) {
      shouldSendReply = false;
    }

    let recentDuplicateMessageQuery = supabase
      .from("messages")
      .select("id")
      .eq("business_id", business.id)
      .eq("customer_phone", customerPhone)
      .eq("incoming_message", incomingMessage)
      .eq("reply_source", replySource)
      .gte("created_at", recentDuplicateSince)
      .limit(1);

    if (finalReply) {
      recentDuplicateMessageQuery = recentDuplicateMessageQuery.eq("bot_reply", finalReply);
    } else {
      recentDuplicateMessageQuery = recentDuplicateMessageQuery.is("bot_reply", null);
    }

    const { data: recentDuplicateMessage } = await recentDuplicateMessageQuery.maybeSingle();

    if (!recentDuplicateMessage) {
      await supabase.from("messages").insert({
        user_id: business.user_id,
        business_id: business.id,
        customer_phone: customerPhone,
        customer_name: customerName ?? null,
        incoming_message: incomingMessage,
        bot_reply: finalReply || null,
        reply_source: replySource,
        model_used: modelUsed ?? null,
        ai_provider: aiProvider ?? null,
        matched_faq_id: matchedFaqId ?? null
      });
    }

    if (canStoreLeads && leadIntent.isLead) {
      const { data: recentDuplicateLead } = await supabase
        .from("leads")
        .select("id")
        .eq("business_id", business.id)
        .eq("customer_phone", customerPhone)
        .eq("message", incomingMessage)
        .gte("created_at", recentDuplicateSince)
        .limit(1)
        .maybeSingle();

      if (!recentDuplicateLead) {
        await supabase.from("leads").insert({
          user_id: business.user_id,
          business_id: business.id,
          customer_name: customerName ?? null,
          customer_phone: customerPhone,
          message: incomingMessage,
          interest: leadIntent.interest,
          status: "new"
        });
      }
    }

    await cleanupBusinessStorage({
      businessId: business.id,
      userId: business.user_id
    });
  }

  if (sendReply && shouldSendReply && finalReply.trim()) {
    await sendWhatsAppReply({
      mode: connectionMode ?? "meta_api",
      businessId: business.id,
      customerPhone,
      message: finalReply
    });
  }

  return {
    matchedFaqId: matchedFaqId ?? null,
    modelUsed: modelUsed ?? null,
    aiProvider: aiProvider ?? null,
    replySource,
    finalReply,
    leadDetected: leadIntent.isLead,
    shouldSendReply
  };
}
