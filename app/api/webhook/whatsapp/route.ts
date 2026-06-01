import { NextResponse } from "next/server";

import { consumeMonthlyMessageQuota } from "@/lib/billing";
import { generateBotReply } from "@/lib/bot/botEngine";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildInboundMessageReceiptKey, claimInboundMessageReceipt } from "@/lib/whatsapp/inboundReceipts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Invalid webhook request", { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: settings } = await supabase
    .from("whatsapp_settings")
    .select("id, verify_token")
    .eq("verify_token", token)
    .maybeSingle();

  if (!settings) {
    return new NextResponse("Verification failed", { status: 403 });
  }

  await supabase
    .from("whatsapp_settings")
    .update({ webhook_verified_at: new Date().toISOString() })
    .eq("id", settings.id);

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabase = getSupabaseAdmin();
    const entries = payload?.entry ?? [];

    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        try {
          const value = change?.value;
          const phoneNumberId = value?.metadata?.phone_number_id;
          const message = value?.messages?.[0];
          const customerPhone = message?.from;
          const customerName = value?.contacts?.[0]?.profile?.name ?? null;
          const text = message?.text?.body;
          const messageId = message?.id;
          const messageTimestamp = message?.timestamp;

          if (!phoneNumberId || !customerPhone || !text) {
            continue;
          }

          const { data: settings } = await supabase
            .from("whatsapp_settings")
            .select("id, business_id, access_token, phone_number_id, businesses(*)")
            .eq("phone_number_id", phoneNumberId)
            .maybeSingle();

          const business = Array.isArray(settings?.businesses) ? settings?.businesses[0] : settings?.businesses;
          const { data: activeConnection } = await supabase
            .from("whatsapp_connections")
            .select("mode, is_active")
            .eq("business_id", settings?.business_id ?? "")
            .maybeSingle();

          if (!settings || !business?.bot_active || (activeConnection && (activeConnection.mode !== "meta_api" || !activeConnection.is_active))) {
            continue;
          }

          const receiptKey = buildInboundMessageReceiptKey({
            scopeId: phoneNumberId,
            customerPhone,
            incomingMessage: text,
            explicitMessageId: messageId,
            timestamp: messageTimestamp
          });
          const receiptClaim = await claimInboundMessageReceipt({
            businessId: settings.business_id,
            receiptKey
          });

          if (!receiptClaim.claimed) {
            continue;
          }

          const quota = await consumeMonthlyMessageQuota({
            businessId: settings.business_id,
            userId: business.user_id,
            includesCurrentMessage: receiptClaim.countedAtReceipt
          });

          if (!quota.allowed) {
            continue;
          }

          await generateBotReply({
            businessId: settings.business_id,
            customerPhone,
            customerName,
            incomingMessage: text,
            sendReply: true,
            connectionMode: "meta_api"
          });
        } catch {
          continue;
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed" }, { status: 500 });
  }
}
