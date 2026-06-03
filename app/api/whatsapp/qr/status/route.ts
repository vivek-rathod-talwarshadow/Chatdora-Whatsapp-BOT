import { NextResponse } from "next/server";

import "@/lib/whatsapp/bootstrap";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureWhatsAppConnection, getConnectionWorkspaceId, updateWhatsAppConnection } from "@/lib/whatsapp/connections";
import {
  callWhatsAppEngine,
  getEngineConnectedPhone,
  getEngineConnectedPhoneFromConversations,
  getEngineQrCode,
  getPersistableEngineStatus,
  getWorkspaceId,
  getWhatsAppEngineHealth,
  mapEngineStatus
} from "@/lib/whatsapp/engine";

function mergeEngineStatus(
  existingStatus: unknown,
  nextStatus: Record<string, unknown> | null
) {
  if (!nextStatus) {
    return existingStatus && typeof existingStatus === "object" ? existingStatus : null;
  }

  if (existingStatus && typeof existingStatus === "object" && !Array.isArray(existingStatus)) {
    return {
      ...(existingStatus as Record<string, unknown>),
      ...nextStatus
    };
  }

  return nextStatus;
}

function getEngineStatusRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getLastConnectedPhoneLookupAt(engineStatus: unknown) {
  const record = getEngineStatusRecord(engineStatus);
  return record && typeof record.connected_phone_lookup_at === "string"
    ? record.connected_phone_lookup_at
    : null;
}

function shouldRefreshConnectedPhoneFromConversations(engineStatus: unknown) {
  const lastLookupAt = getLastConnectedPhoneLookupAt(engineStatus);

  if (!lastLookupAt) {
    return true;
  }

  const lastLookupMs = new Date(lastLookupAt).getTime();
  if (!Number.isFinite(lastLookupMs) || lastLookupMs <= 0) {
    return true;
  }

  return Date.now() - lastLookupMs >= 30 * 60 * 1000;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    const user = await getCurrentUser();
    const adminSupabase = getSupabaseAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const { data: business } = await adminSupabase
      .from("businesses")
      .select("id,user_id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const ensuredConnection = await ensureWhatsAppConnection({ userId: user.id, businessId, mode: "qr_login" });
    const [{ data: connection }, engineHealth] = await Promise.all([
      adminSupabase.from("whatsapp_connections").select("*").eq("business_id", businessId).maybeSingle(),
      getWhatsAppEngineHealth(),
    ]);
    const workspaceId = getConnectionWorkspaceId(connection ?? ensuredConnection) ?? getWorkspaceId(businessId);

    if (!connection || connection.mode !== "qr_login") {
      return NextResponse.json({
        workspaceId,
        connection,
        activeMode: connection?.mode ?? null,
        qr: null,
        engineHealth
      });
    }

    let engineResponse: Record<string, unknown> | null = null;
    let engineError: string | null = null;

    try {
      engineResponse = await callWhatsAppEngine<Record<string, unknown>>(`/sessions/${workspaceId}`);
    } catch (error) {
      engineError = error instanceof Error ? error.message : "Unable to contact WhatsApp engine";
    }

    if (!engineResponse) {
      await updateWhatsAppConnection({
        businessId,
        mode: "qr_login",
        status: connection.status === "connected" ? "disconnected" : "failed",
        isActive: connection?.is_active ?? false,
        connectedPhone: connection?.connected_phone ?? null,
        engineStatus: mergeEngineStatus(connection?.engine_status, getPersistableEngineStatus(engineHealth?.data)),
        lastError: engineError
      });

      return NextResponse.json({
        workspaceId,
        connection: {
          ...(connection ?? {}),
          workspace_id: workspaceId,
          last_error: engineError,
          status: connection.status === "connected" ? "disconnected" : "failed"
        },
        activeMode: connection?.mode ?? null,
        qr: null,
        engineHealth
      });
    }

    let connectedPhone = getEngineConnectedPhone(engineResponse);
    const qr = getEngineQrCode(engineResponse);
    const status = mapEngineStatus(
      typeof engineResponse.status === "string"
        ? engineResponse.status
        : qr
          ? "qr_ready"
          : connectedPhone
            ? "connected"
            : "not_connected"
    );

    let connectedPhoneLookupAttemptedAt: string | null = null;

    if (!connectedPhone && status === "connected" && shouldRefreshConnectedPhoneFromConversations(connection?.engine_status)) {
      try {
        connectedPhoneLookupAttemptedAt = new Date().toISOString();
        const conversationsResponse = await callWhatsAppEngine<Record<string, unknown>>(`/sessions/${workspaceId}/conversations`);
        connectedPhone = getEngineConnectedPhoneFromConversations(conversationsResponse);
      } catch {
        connectedPhone = null;
      }
    }

    await updateWhatsAppConnection({
      businessId,
      mode: "qr_login",
      status,
      isActive: connection?.is_active ?? false,
      connectedPhone,
      engineStatus: mergeEngineStatus(connection?.engine_status, {
        ...(getPersistableEngineStatus(engineResponse) ?? {}),
        ...(connectedPhoneLookupAttemptedAt ? { connected_phone_lookup_at: connectedPhoneLookupAttemptedAt } : {})
      }),
      lastError: typeof engineResponse.error === "string" ? engineResponse.error : null,
      lastConnectedAt: status === "connected" ? new Date().toISOString() : connection?.last_connected_at ?? null
    });

    return NextResponse.json({
      workspaceId,
      connection: {
        ...(connection ?? {}),
        workspace_id: workspaceId,
        status,
        connected_phone: connectedPhone,
        engine_status: mergeEngineStatus(connection?.engine_status, {
          ...(getPersistableEngineStatus(engineResponse) ?? {}),
          ...(connectedPhoneLookupAttemptedAt ? { connected_phone_lookup_at: connectedPhoneLookupAttemptedAt } : {})
        }),
        last_error: typeof engineResponse.error === "string" ? engineResponse.error : null
      },
      activeMode: connection?.mode ?? null,
      qr,
      engineHealth
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to fetch QR status" }, { status: 500 });
  }
}
