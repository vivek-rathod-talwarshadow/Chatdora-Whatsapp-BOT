import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeExplicitId(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    if (normalized) {
      return normalized;
    }
  }

  return "no-ts";
}

export function buildInboundMessageReceiptKey(params: {
  scopeId: string;
  customerPhone: string;
  incomingMessage: string;
  explicitMessageId?: unknown;
  timestamp?: unknown;
}) {
  const explicitId = normalizeExplicitId(params.explicitMessageId);
  if (explicitId) {
    return `${params.scopeId}:${explicitId}`;
  }

  return [
    params.scopeId,
    params.customerPhone.trim(),
    normalizeTimestamp(params.timestamp),
    params.incomingMessage.trim().toLowerCase()
  ].join(":");
}

export async function claimInboundMessageReceipt(params: {
  businessId: string;
  receiptKey: string;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("inbound_message_receipts").insert({
    business_id: params.businessId,
    receipt_key: params.receiptKey
  });

  if (error?.code === "PGRST205") {
    return { claimed: true as const, countedAtReceipt: false as const };
  }

  if (error?.code === "23505") {
    return { claimed: false as const, countedAtReceipt: true as const };
  }

  if (error) {
    throw new Error(error.message);
  }

  return { claimed: true as const, countedAtReceipt: true as const };
}
