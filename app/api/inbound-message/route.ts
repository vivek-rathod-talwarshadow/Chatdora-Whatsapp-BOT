import { NextResponse } from "next/server";

import { consumeMonthlyMessageQuota } from "@/lib/billing";
import { generateBotReply } from "@/lib/bot/botEngine";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildInboundMessageReceiptKey, claimInboundMessageReceipt } from "@/lib/whatsapp/inboundReceipts";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const workspaceId = String(body.workspace_id ?? body.workspaceId ?? "");
    const customerPhone = String(body.customer_phone ?? body.from ?? body.phone ?? "");
    const customerNameValue = body.customer_name ?? body.name ?? body.push_name ?? null;
    const customerName = typeof customerNameValue === "string" && customerNameValue.trim().length > 0
      ? customerNameValue.trim()
      : null;
    const incomingMessage = String(body.message ?? body.text ?? body.body ?? "");

    if (!workspaceId || !customerPhone || !incomingMessage) {
      return NextResponse.json({ error: "Missing workspace_id, customer phone, or message" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("business_id, is_active, mode, user_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({
        ai_sent: false,
        reply: "",
        error: "Connection not found"
      });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, bot_active")
      .eq("id", connection.business_id)
      .maybeSingle();

    if (connection.mode !== "qr_login" || !business?.bot_active || !connection.is_active) {
      return NextResponse.json({
        ai_sent: false,
        reply: "",
        error: "Connection inactive",
        debug: {
          mode: connection.mode,
          is_active: connection.is_active,
          bot_active: business?.bot_active ?? null
        }
      });
    }

    const inboundMessageKey = buildInboundMessageReceiptKey({
      scopeId: workspaceId,
      customerPhone,
      incomingMessage,
      explicitMessageId:
        body.external_message_id ??
        body.externalMessageId ??
        body.message_id ??
        body.messageId ??
        body.id,
      timestamp: body.timestamp
    });
    const receiptClaim = await claimInboundMessageReceipt({
      businessId: connection.business_id,
      receiptKey: inboundMessageKey
    });

    if (!receiptClaim.claimed) {
      return NextResponse.json({
        ai_sent: false,
        reply: "",
        deduped: true
      });
    }

    const quota = await consumeMonthlyMessageQuota({
      businessId: connection.business_id,
      userId: connection.user_id,
      includesCurrentMessage: receiptClaim.countedAtReceipt
    });

    if (!quota.allowed) {
      return NextResponse.json({
        ai_sent: false,
        reply: "",
        deduped: false,
        upgrade_required: true
      });
    }

    const result = await generateBotReply({
      businessId: connection.business_id,
      customerPhone,
      customerName,
      incomingMessage,
      sendReply: false,
      persistLogs: true,
      connectionMode: "qr_login"
    });

    return NextResponse.json({
      ai_sent: Boolean(result.finalReply.trim()),
      reply: result.finalReply,
      lead_id: result.leadDetected ? "detected" : null,
      deduped: false
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Inbound processing failed" }, { status: 500 });
  }
}
