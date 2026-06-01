import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapEngineStatus, getWorkspaceId } from "@/lib/whatsapp/engine";
import type { WhatsAppConnectionMode } from "@/lib/types";

function getEngineStatusRecord(engineStatus: unknown) {
  if (engineStatus && typeof engineStatus === "object" && !Array.isArray(engineStatus)) {
    return engineStatus as Record<string, unknown>;
  }

  return {};
}

function mergeEngineStatus(existingStatus: unknown, nextStatus: unknown) {
  const current = getEngineStatusRecord(existingStatus);
  const incoming = getEngineStatusRecord(nextStatus);

  return {
    ...current,
    ...incoming
  };
}

export function getPausedCustomerPhones(engineStatus: unknown) {
  const record = getEngineStatusRecord(engineStatus);
  const pausedPhones = record.paused_customer_phones;

  if (!Array.isArray(pausedPhones)) {
    return [] as string[];
  }

  return pausedPhones.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export function getRecentInboundMessageKeys(engineStatus: unknown) {
  const record = getEngineStatusRecord(engineStatus);
  const keys = record.recent_inbound_message_keys;

  if (!Array.isArray(keys)) {
    return [] as string[];
  }

  return keys.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export async function markRecentInboundMessageKey(params: {
  businessId: string;
  key: string;
  maxKeys?: number;
}) {
  const supabase = getSupabaseAdmin();
  const maxKeys = params.maxKeys ?? 250;
  const { data: connection, error } = await supabase
    .from("whatsapp_connections")
    .select("id, engine_status")
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!connection) {
    throw new Error("WhatsApp connection not found");
  }

  const engineStatus = getEngineStatusRecord(connection.engine_status);
  const recentKeys = getRecentInboundMessageKeys(connection.engine_status).filter((value) => value !== params.key);

  recentKeys.push(params.key);

  const { error: updateError } = await supabase
    .from("whatsapp_connections")
    .update({
      engine_status: {
        ...engineStatus,
        recent_inbound_message_keys: recentKeys.slice(-maxKeys)
      }
    })
    .eq("id", connection.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function ensureWhatsAppConnection(params: {
  userId: string;
  businessId: string;
  mode: WhatsAppConnectionMode;
}) {
  const supabase = getSupabaseAdmin();
  const workspaceId = getWorkspaceId(params.businessId);

  const { data: existing, error: existingError } = await supabase
    .from("whatsapp_connections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("whatsapp_connections")
    .insert({
      user_id: params.userId,
      business_id: params.businessId,
      workspace_id: workspaceId,
      mode: params.mode,
      status: "not_connected",
      is_active: false
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to create WhatsApp connection");
  }

  return data;
}

export async function updateWhatsAppConnection(params: {
  businessId: string;
  mode?: WhatsAppConnectionMode;
  status?: string | null;
  isActive?: boolean;
  connectedPhone?: string | null;
  engineStatus?: unknown;
  lastError?: string | null;
  lastConnectedAt?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};

  const { data: currentConnection, error: currentConnectionError } = await supabase
    .from("whatsapp_connections")
    .select("engine_status")
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (currentConnectionError) {
    throw new Error(currentConnectionError.message);
  }

  if (params.status !== undefined) patch.status = mapEngineStatus(params.status);
  if (params.isActive !== undefined) patch.is_active = params.isActive;
  if (params.connectedPhone !== undefined) patch.connected_phone = params.connectedPhone;
  if (params.engineStatus !== undefined) {
    patch.engine_status = mergeEngineStatus(currentConnection?.engine_status, params.engineStatus);
  }
  if (params.lastError !== undefined) patch.last_error = params.lastError;
  if (params.lastConnectedAt !== undefined) patch.last_connected_at = params.lastConnectedAt;
  if (params.mode !== undefined) patch.mode = params.mode;

  const { error } = await supabase.from("whatsapp_connections").update(patch).eq("business_id", params.businessId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function setActiveConnectionMode(params: {
  businessId: string;
  userId: string;
  mode: WhatsAppConnectionMode;
}) {
  await ensureWhatsAppConnection(params);
  await updateWhatsAppConnection({
    businessId: params.businessId,
    mode: params.mode,
    isActive: true
  });
}

export async function setCustomerBotPaused(params: {
  businessId: string;
  customerPhone: string;
  isPaused: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { data: connection, error } = await supabase
    .from("whatsapp_connections")
    .select("id, engine_status")
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!connection) {
    throw new Error("WhatsApp connection not found");
  }

  const engineStatus = getEngineStatusRecord(connection.engine_status);
  const pausedPhones = new Set(getPausedCustomerPhones(connection.engine_status));

  if (params.isPaused) {
    pausedPhones.add(params.customerPhone);
  } else {
    pausedPhones.delete(params.customerPhone);
  }

  const { error: updateError } = await supabase
    .from("whatsapp_connections")
    .update({
      engine_status: {
        ...engineStatus,
        paused_customer_phones: Array.from(pausedPhones)
      }
    })
    .eq("id", connection.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
