import { NextResponse } from "next/server";

import { consumeMonthlyMessageQuota } from "@/lib/billing";
import { generateBotReply } from "@/lib/bot/botEngine";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { updateWhatsAppConnection } from "@/lib/whatsapp/connections";
import { buildInboundMessageReceiptKey, claimInboundMessageReceipt, releaseInboundMessageReceipt } from "@/lib/whatsapp/inboundReceipts";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNumberStringValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return getStringValue(value);
}

function getNestedValue(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;

  for (const part of path) {
    const next = asRecord(current);
    if (!next || !(part in next)) {
      return null;
    }

    current = next[part];
  }

  return current;
}

function pickFirstString(record: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = getNestedValue(record, path);
    const normalized = getStringValue(value) ?? getNumberStringValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeCustomerPhone(value: string) {
  return value.replace(/@.+$/, "").trim();
}

function extractIncomingText(record: Record<string, unknown>): string {
  const nestedMessage = asRecord(record.message);
  const ephemeralMessage = asRecord(record.ephemeralMessage);
  const ephemeralNestedMessage = asRecord(asRecord(ephemeralMessage?.message)?.message);
  const viewOnceMessage = asRecord(record.viewOnceMessage);
  const viewOnceNestedMessage = asRecord(asRecord(viewOnceMessage?.message)?.message);
  const viewOnceMessageV2 = asRecord(record.viewOnceMessageV2);
  const viewOnceMessageV2NestedMessage = asRecord(asRecord(viewOnceMessageV2?.message)?.message);
  const viewOnceMessageV2Extension = asRecord(record.viewOnceMessageV2Extension);
  const viewOnceMessageV2ExtensionNestedMessage = asRecord(asRecord(viewOnceMessageV2Extension?.message)?.message);

  const directText = pickFirstString(record, [
    ["message"],
    ["text"],
    ["body"],
    ["content"],
    ["caption"],
    ["conversation"],
    ["extendedTextMessage", "text"],
    ["text", "body"],
    ["text", "text"],
    ["message", "text"],
    ["message", "body"],
    ["message", "conversation"],
    ["message", "extendedTextMessage", "text"],
    ["data", "text"],
    ["data", "body"],
    ["payload", "text"],
    ["payload", "body"],
    ["imageMessage", "caption"],
    ["videoMessage", "caption"],
    ["documentWithCaptionMessage", "message", "documentMessage", "caption"],
    ["buttonsResponseMessage", "selectedDisplayText"],
    ["listResponseMessage", "title"],
    ["listResponseMessage", "singleSelectReply", "selectedRowId"],
    ["templateButtonReplyMessage", "selectedDisplayText"]
  ]);

  if (directText) {
    return directText;
  }

  for (const candidate of [
    nestedMessage,
    ephemeralNestedMessage,
    viewOnceNestedMessage,
    viewOnceMessageV2NestedMessage,
    viewOnceMessageV2ExtensionNestedMessage
  ]) {
    if (!candidate) {
      continue;
    }

    const nestedText: string = extractIncomingText(candidate);
    if (nestedText) {
      return nestedText;
    }
  }

  return "";
}

function getInboundPayloadCandidates(body: Record<string, unknown>) {
  const candidates: Record<string, unknown>[] = [body];
  const seen = new Set<Record<string, unknown>>([body]);

  const appendCandidate = (value: unknown) => {
    const record = asRecord(value);
    if (record && !seen.has(record)) {
      seen.add(record);
      candidates.push(record);
    }
  };

  for (const key of ["payload", "data", "event", "message", "msg"]) {
    appendCandidate(body[key]);
  }

  for (const wrapperKey of ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension"]) {
    const wrapper = asRecord(body[wrapperKey]);
    appendCandidate(wrapper?.message);
  }

  for (const key of ["messages", "events", "entries"]) {
    const items = body[key];
    if (Array.isArray(items)) {
      for (const item of items) {
        appendCandidate(item);
      }
    }
  }

  return candidates;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const candidates = getInboundPayloadCandidates(body);
    const workspaceId = candidates
      .map((candidate) =>
        pickFirstString(candidate, [
          ["workspace_id"],
          ["workspaceId"],
          ["session_id"],
          ["sessionId"],
          ["data", "workspace_id"],
          ["data", "workspaceId"],
          ["payload", "workspace_id"],
          ["payload", "workspaceId"]
        ])
      )
      .find(Boolean) ?? "";
    const customerPhone = normalizeCustomerPhone(
      candidates
        .map((candidate) =>
          pickFirstString(candidate, [
            ["customer_phone"],
            ["customerPhone"],
            ["from"],
            ["phone"],
            ["sender"],
            ["participant"],
            ["remoteJid"],
            ["chat_id"],
            ["chatId"],
            ["key", "remoteJid"],
            ["key", "participant"],
            ["data", "from"],
            ["payload", "from"]
          ])
        )
        .find(Boolean) ?? ""
    );
    const customerNameValue = candidates
      .map((candidate) =>
        pickFirstString(candidate, [
          ["customer_name"],
          ["customerName"],
          ["name"],
          ["push_name"],
          ["pushName"],
          ["notifyName"],
          ["data", "name"],
          ["payload", "name"]
        ])
      )
      .find(Boolean) ?? null;
    const customerName = typeof customerNameValue === "string" && customerNameValue.trim().length > 0
      ? customerNameValue.trim()
      : null;
    const incomingMessage = candidates.map(extractIncomingText).find(Boolean) ?? "";
    const explicitMessageId = candidates
      .map((candidate) =>
        pickFirstString(candidate, [
          ["external_message_id"],
          ["externalMessageId"],
          ["message_id"],
          ["messageId"],
          ["id"],
          ["key", "id"],
          ["data", "id"],
          ["payload", "id"]
        ])
      )
      .find(Boolean);
    const timestamp = candidates
      .map((candidate) =>
        pickFirstString(candidate, [
          ["timestamp"],
          ["messageTimestamp"],
          ["message_timestamp"],
          ["data", "timestamp"],
          ["payload", "timestamp"]
        ])
      )
      .find(Boolean);

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
      explicitMessageId,
      timestamp
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

    let result;
    try {
      result = await generateBotReply({
        businessId: connection.business_id,
        customerPhone,
        customerName,
        incomingMessage,
        // Send the WhatsApp reply directly from the dashboard so QR mode
        // does not depend on the engine honoring the webhook response body.
        sendReply: true,
        persistLogs: true,
        connectionMode: "qr_login"
      });
    } catch (error) {
      await releaseInboundMessageReceipt({
        businessId: connection.business_id,
        receiptKey: inboundMessageKey
      }).catch(() => undefined);
      throw error;
    }

    await updateWhatsAppConnection({
      businessId: connection.business_id,
      lastError: null,
      engineStatus: {
        last_inbound_callback_at: new Date().toISOString(),
        last_inbound_receipt_key: inboundMessageKey
      }
    }).catch(() => undefined);

    return NextResponse.json({
      ai_sent: false,
      reply: "",
      generated_reply: result.finalReply,
      lead_id: result.leadDetected ? "detected" : null,
      deduped: false
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Inbound processing failed" }, { status: 500 });
  }
}
