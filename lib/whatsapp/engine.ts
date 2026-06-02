import "server-only";

import { getWhatsAppEngineBaseUrl, getWhatsAppEngineDashboardToken } from "@/lib/config";

const DEFAULT_ENGINE_TIMEOUT_MS = 15000;

export function getWorkspaceId(businessId: string) {
  return `workspace_${businessId}`;
}

function buildEngineUrl(path: string) {
  return `${getWhatsAppEngineBaseUrl()}${path}`;
}

function normalizeEngineResponse(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  if (typeof record.status === "string") {
    normalized.status = record.status;
  }

  if (typeof record.phone === "string") {
    normalized.phone = record.phone;
  }

  if (typeof record.phoneNumber === "string") {
    normalized.phoneNumber = record.phoneNumber;
  }

  if (typeof record.connectedPhone === "string") {
    normalized.connectedPhone = record.connectedPhone;
  }

  if (typeof record.error === "string") {
    normalized.error = record.error;
  }

  if (typeof record.activeSessions === "number") {
    normalized.activeSessions = record.activeSessions;
  }

  if (typeof record.uptime === "string" || typeof record.uptime === "number") {
    normalized.uptime = record.uptime;
  }

  return normalized;
}

async function fetchEngine(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_ENGINE_TIMEOUT_MS);

  try {
    return await fetch(buildEngineUrl(path), {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function callWhatsAppEngine<T>(
  path: string,
  init?: RequestInit
) {
  const dashboardToken = getWhatsAppEngineDashboardToken();

  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (dashboardToken) {
    headers.set("Authorization", `Bearer ${dashboardToken}`);
  }

  const response = await fetchEngine(path, {
    ...init,
    headers
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data?.error || `WhatsApp engine request failed with ${response.status}`);
  }

  return data as T;
}

export async function getWhatsAppEngineHealth() {
  try {
    const dashboardToken = getWhatsAppEngineDashboardToken();
    const response = await fetchEngine("/health", {
      headers: dashboardToken
        ? {
            Authorization: `Bearer ${dashboardToken}`
          }
        : undefined
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return {
      online: response.ok,
      data
    };
  } catch {
    return {
      online: false,
      data: null
    };
  }
}

export function mapEngineStatus(status: string | undefined | null) {
  switch (status) {
    case "qr_pending":
      return "qr_ready" as const;
    case "qr_ready":
    case "connecting":
    case "connected":
    case "disconnected":
    case "failed":
      return status;
    case "pending":
    case "not_connected":
    default:
      return "not_connected" as const;
  }
}

export function getEngineQrCode(data: Record<string, unknown> | null | undefined) {
  if (!data) return null;

  return typeof data.qrImage === "string"
    ? data.qrImage
    : typeof data.qrCode === "string"
      ? data.qrCode
      : typeof data.qr === "string"
        ? data.qr
        : null;
}

export function getEngineConnectedPhone(data: Record<string, unknown> | null | undefined) {
  if (!data) return null;

  return typeof data.connectedPhone === "string"
    ? data.connectedPhone
    : typeof data.phone === "string"
      ? data.phone
      : typeof data.phoneNumber === "string"
        ? data.phoneNumber
        : null;
}

export function getEngineConnectedPhoneFromConversations(data: Record<string, unknown> | null | undefined) {
  const conversations = getEngineConversations(data);

  const explicitSelfConversation = conversations.find((conversation) => {
    const candidate = conversation as Record<string, unknown>;
    return candidate.is_me === true || candidate.self === true || candidate.type === "self";
  });

  if (explicitSelfConversation?.phone) {
    return explicitSelfConversation.phone;
  }

  const likelySelfConversation = conversations.find((conversation) => {
    const hasWhatsappJid = typeof conversation.chat_id === "string" && conversation.chat_id.endsWith("@s.whatsapp.net");
    const hasNoMessages = !conversation.messages?.length && !conversation.last_message;
    const hasNamedPhone = typeof conversation.name === "string" && conversation.name.trim().startsWith("+");
    return hasWhatsappJid && hasNoMessages && hasNamedPhone && typeof conversation.phone === "string";
  });

  if (likelySelfConversation?.phone) {
    return likelySelfConversation.phone;
  }

  return null;
}

export interface EngineConversationMessage {
  id?: string;
  external_message_id?: string;
  content?: string;
  direction?: string;
  timestamp?: string;
  delivery_status?: string;
}

export interface EngineConversation {
  id?: string;
  chat_id?: string;
  phone?: string;
  name?: string;
  unread_count?: number;
  last_message?: EngineConversationMessage | null;
  messages?: EngineConversationMessage[];
}

export function getEngineConversations(data: Record<string, unknown> | null | undefined) {
  if (!data || !Array.isArray(data.conversations)) {
    return [] as EngineConversation[];
  }

  return data.conversations as EngineConversation[];
}

export function getPersistableEngineStatus(data: unknown) {
  return normalizeEngineResponse(data);
}
