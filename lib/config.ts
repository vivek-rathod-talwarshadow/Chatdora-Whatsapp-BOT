function normalizeAppUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }

  return `https://${trimmed.replace(/\/$/, "")}`;
}

export function getAppUrl() {
  return (
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeAppUrl(process.env.RENDER_EXTERNAL_URL) ||
    normalizeAppUrl(process.env.RENDER_PUBLIC_URL) ||
    normalizeAppUrl(process.env.URL) ||
    normalizeAppUrl(process.env.VERCEL_URL) ||
    "http://localhost:3000"
  );
}

export function getWhatsAppEngineBaseUrl() {
  return process.env.WHATSAPP_ENGINE_BASE_URL || "https://wa.chatdora.in";
}

export function getWhatsAppEngineDashboardToken() {
  const token = process.env.CHATDORA_DASHBOARD_TOKEN?.trim();

  if (!token) {
    return null;
  }

  const normalized = token.toLowerCase();
  if (normalized === "value" || normalized === "generate" || normalized === "changeme") {
    return null;
  }

  return token;
}

export type BackgroundQrSyncMode = "off" | "auto" | "always";

export function getBackgroundQrSyncMode(): BackgroundQrSyncMode {
  const value = process.env.ENABLE_BACKGROUND_QR_SYNC?.trim().toLowerCase();

  if (!value) {
    return "auto";
  }

  if (["false", "0", "off", "no", "disabled"].includes(value)) {
    return "off";
  }

  if (["always", "force"].includes(value)) {
    return "always";
  }

  if (["auto", "true", "1", "on", "yes", "enabled"].includes(value)) {
    return "auto";
  }

  return "auto";
}

export function isBackgroundQrSyncEnabled() {
  return getBackgroundQrSyncMode() !== "off";
}

export function shouldRunBackgroundQrSync() {
  return isBackgroundQrSyncEnabled();
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getQrSyncMemoryCeilingMb() {
  return getPositiveIntegerEnv("QR_SYNC_MEMORY_CEILING_MB", 340);
}

export function getQrSyncMaxConversationsPerRun() {
  return getPositiveIntegerEnv("QR_SYNC_MAX_CONVERSATIONS_PER_RUN", 8);
}

export function getQrSyncMaxMessagesPerConversation() {
  return getPositiveIntegerEnv("QR_SYNC_MAX_MESSAGES_PER_CONVERSATION", 20);
}

export function getQrSyncMaxRepliesPerRun() {
  return getPositiveIntegerEnv("QR_SYNC_MAX_REPLIES_PER_RUN", 8);
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
  const primaryCallbackUrl = `${appUrl.replace(/\/$/, "")}/api/inbound-message`;

  try {
    const parsed = new URL(appUrl);
    const isPublic = parsed.protocol === "https:" && !isPrivateHostname(parsed.hostname);

    return {
      appUrl,
      callbackUrl: primaryCallbackUrl,
      isPublic,
      reason: isPublic
        ? null
        : "Your app URL is local or private. The deployed WhatsApp engine cannot send inbound messages to it."
    };
  } catch {
    return {
      appUrl,
      callbackUrl: primaryCallbackUrl,
      isPublic: false,
      reason: "NEXT_PUBLIC_APP_URL is invalid, so inbound WhatsApp replies cannot be delivered."
    };
  }
}

export function getInboundCallbackUrls() {
  const appUrl = getAppUrl().replace(/\/$/, "");

  return {
    primary: `${appUrl}/api/inbound-message`,
    legacy: `${appUrl}/Whatsapp-web-bot/api/inbound-message/`
  };
}
