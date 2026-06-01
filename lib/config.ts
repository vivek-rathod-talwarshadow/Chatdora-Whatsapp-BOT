export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getWhatsAppEngineBaseUrl() {
  return process.env.WHATSAPP_ENGINE_BASE_URL || "https://wa.chatdora.in";
}

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase();

  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.endsWith(".local")
  ) {
    return true;
  }

  if (lower.startsWith("10.") || lower.startsWith("192.168.")) {
    return true;
  }

  const parts = lower.split(".");
  if (parts.length === 4 && parts[0] === "172") {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }

  return false;
}

export function getInboundCallbackHealth() {
  const appUrl = getAppUrl();

  try {
    const parsed = new URL(appUrl);
    const isPublic = parsed.protocol === "https:" && !isPrivateHostname(parsed.hostname);

    return {
      appUrl,
      callbackUrl: `${appUrl.replace(/\/$/, "")}/api/inbound-message`,
      isPublic,
      reason: isPublic
        ? null
        : "Your app URL is local or private. The deployed WhatsApp engine cannot send inbound messages to it."
    };
  } catch {
    return {
      appUrl,
      callbackUrl: `${appUrl.replace(/\/$/, "")}/api/inbound-message`,
      isPublic: false,
      reason: "NEXT_PUBLIC_APP_URL is invalid, so inbound WhatsApp replies cannot be delivered."
    };
  }
}
