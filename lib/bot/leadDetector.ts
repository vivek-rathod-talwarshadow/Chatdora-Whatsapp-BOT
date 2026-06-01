const LEAD_KEYWORDS = [
  "price",
  "cost",
  "interested",
  "demo",
  "service",
  "buy",
  "order",
  "appointment",
  "booking",
  "contact",
  "call",
  "quote"
];

const HANDOFF_KEYWORDS = ["human", "agent", "owner", "support", "call me", "talk to person"];
const WEBSITE_LEAD_PATTERNS = [
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

const TRIVIAL_MESSAGES = new Set([
  "hi",
  "hii",
  "hiii",
  "hello",
  "hey",
  "heyy",
  "yo",
  "ok",
  "okay",
  "thanks",
  "thank you"
]);

function normalizeLeadText(message: string) {
  return message.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function isTrivialMessage(message: string) {
  const normalized = normalizeLeadText(message);
  return !normalized || TRIVIAL_MESSAGES.has(normalized);
}

export function detectLeadIntent(message: string, options?: { hasPriorConversation?: boolean }) {
  const normalized = message.toLowerCase().trim();
  const websiteLead = WEBSITE_LEAD_PATTERNS.find((pattern) => normalized.includes(pattern));

  if (websiteLead) {
    return {
      isLead: true,
      interest: "website_development"
    };
  }

  const matchedKeyword = LEAD_KEYWORDS.find((keyword) => normalized.includes(keyword));

  if (matchedKeyword) {
    return {
      isLead: true,
      interest: matchedKeyword
    };
  }

  if (options?.hasPriorConversation && !isTrivialMessage(message)) {
    return {
      isLead: true,
      interest: "engaged_follow_up"
    };
  }

  return {
    isLead: false,
    interest: null
  };
}

export function shouldTriggerHumanHandoff(message: string) {
  const normalized = message.toLowerCase();
  return HANDOFF_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
