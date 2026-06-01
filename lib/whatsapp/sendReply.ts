import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { WhatsAppConnectionMode } from "@/lib/types";
import { callWhatsAppEngine, getWorkspaceId } from "@/lib/whatsapp/engine";
import { sendWhatsAppMessage } from "@/lib/whatsapp/sendMessage";

export async function sendWhatsAppReply({
  mode,
  businessId,
  customerPhone,
  message
}: {
  mode: WhatsAppConnectionMode;
  businessId: string;
  customerPhone: string;
  message: string;
}) {
  if (mode === "qr_login") {
    await callWhatsAppEngine(`/sessions/${getWorkspaceId(businessId)}/send`, {
      method: "POST",
      body: JSON.stringify({
        phone: customerPhone,
        reply: message
      })
    });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: settings, error } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !settings?.access_token || !settings?.phone_number_id) {
    throw new Error(error?.message || "Official API settings are missing");
  }

  await sendWhatsAppMessage({
    accessToken: settings.access_token,
    phoneNumberId: settings.phone_number_id,
    to: customerPhone,
    message
  });
}
