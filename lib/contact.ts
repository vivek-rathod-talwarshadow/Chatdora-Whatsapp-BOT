export const CHATDORA_DOMAIN = "chatdora.in";
export const CHATDORA_WEBSITE = `https://${CHATDORA_DOMAIN}`;
export const CHATDORA_CONTACT_EMAIL = "contactus@chatdora.in";
export const CHATDORA_SUPPORT_PHONE = "+91 7622858519";
export const CHATDORA_SUPPORT_PHONE_RAW = "7622858519";
export const CHATDORA_SUPPORT_HOURS = "Monday to Saturday, 10:00 AM to 7:00 PM IST";
export const CHATDORA_HELP_EMAIL_SUBJECT = "ChatDora Help Request";

export function getChatDoraMailtoLink(subject?: string) {
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${CHATDORA_CONTACT_EMAIL}${params}`;
}
