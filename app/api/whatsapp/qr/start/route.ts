import { NextResponse } from "next/server";

import "@/lib/whatsapp/bootstrap";
import { getInboundCallbackUrls } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createRestartWorkspaceId,
  ensureWhatsAppConnection,
  getConnectionWorkspaceId,
  setActiveConnectionMode,
  updateWhatsAppConnection
} from "@/lib/whatsapp/connections";
import {
  callWhatsAppEngine,
  getEngineConnectedPhone,
  getEngineQrCode,
  getPersistableEngineStatus,
  getWorkspaceId,
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

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminSupabase = getSupabaseAdmin();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, forceRestart } = (await request.json()) as {
      businessId?: string;
      forceRestart?: boolean;
    };
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

    const connection = await ensureWhatsAppConnection({ userId: user.id, businessId, mode: "qr_login" });
    await setActiveConnectionMode({ businessId, userId: user.id, mode: "qr_login" });
    const callbackUrls = getInboundCallbackUrls();
    let workspaceId = getConnectionWorkspaceId(connection) ?? getWorkspaceId(businessId);

    if (forceRestart) {
      workspaceId = createRestartWorkspaceId(businessId);
      await updateWhatsAppConnection({
        businessId,
        workspaceId,
        status: "not_connected",
        connectedPhone: null,
        lastError: null,
        lastConnectedAt: null
      });
    }

    let engineResponse;
    try {
      engineResponse = await callWhatsAppEngine<Record<string, unknown>>(
        `/sessions/${workspaceId}/start`,
        {
          method: "POST",
          body: JSON.stringify({
            callbackUrl: callbackUrls.primary,
            inboundCallbackUrl: callbackUrls.primary,
            webhookUrl: callbackUrls.primary,
            legacyCallbackUrl: callbackUrls.legacy,
            workspaceId
          })
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start QR session";
      await updateWhatsAppConnection({
        businessId,
        mode: "qr_login",
        status: "failed",
        isActive: true,
        lastError: message
      });
      return NextResponse.json({ error: message }, { status: 200 });
    }

    const qrCode = getEngineQrCode(engineResponse);
    const connectedPhone = getEngineConnectedPhone(engineResponse);
    const status = mapEngineStatus(
      typeof engineResponse.status === "string"
        ? engineResponse.status
        : qrCode
          ? "qr_ready"
          : connectedPhone
            ? "connected"
            : "connecting"
    );

    await updateWhatsAppConnection({
      businessId,
      mode: "qr_login",
      status,
      isActive: true,
      workspaceId,
      connectedPhone,
      engineStatus: mergeEngineStatus(connection?.engine_status, getPersistableEngineStatus(engineResponse)),
      lastError: null,
      lastConnectedAt: status === "connected" ? new Date().toISOString() : null
    });

    return NextResponse.json({
      workspaceId,
      status,
      qr: qrCode,
      connectedPhone,
      needsReconnect: false
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start QR session" }, { status: 500 });
  }
}
