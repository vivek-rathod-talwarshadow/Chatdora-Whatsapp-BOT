import "server-only";

import { subDays } from "date-fns";

import { getPlanSummaryForBusiness } from "@/lib/billing";
import { getInboundCallbackHealth } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWhatsAppEngineHealth, getWorkspaceId } from "@/lib/whatsapp/engine";

export async function getDashboardContext() {
  const authSupabase = await createSupabaseServerClient();
  const supabase = getSupabaseAdmin();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const since = subDays(new Date(), 1).toISOString();

  const [
    { data: business },
    faqsResult,
    leadsResult,
    messagesResult,
    { data: whatsappSettings },
    aiRepliesResult,
    { data: whatsappConnection },
    engineHealth
  ] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("faqs").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("whatsapp_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("reply_source", "ai").gte("created_at", since),
      supabase.from("whatsapp_connections").select("*").eq("user_id", user.id).maybeSingle(),
      getWhatsAppEngineHealth()
    ]);

  const plan = await getPlanSummaryForBusiness({
    businessId: business?.id ?? null,
    userId: user.id
  });

  const inboundCallbackHealth = getInboundCallbackHealth();
  const qrConnected =
    whatsappConnection?.mode === "qr_login"
      ? whatsappConnection?.status === "connected" && whatsappConnection?.is_active
      : false;
  const qrReplyReady = qrConnected && inboundCallbackHealth.isPublic;
  const qrLocalTestMode = qrConnected && !inboundCallbackHealth.isPublic;
  const metaReplyReady = Boolean(whatsappSettings?.is_connected);

  return {
    user,
    business: business ?? null,
    whatsappSettings: whatsappSettings ?? null,
    whatsappConnection: whatsappConnection ?? null,
    plan,
    engineHealth,
    inboundCallbackHealth,
    qrLocalTestMode,
    stats: {
      totalFaqs: plan.isPlus ? faqsResult.count ?? 0 : 0,
      totalLeads: plan.isPlus ? leadsResult.count ?? 0 : 0,
      totalMessages: plan.isPlus ? messagesResult.count ?? 0 : 0,
      aiRepliesToday: aiRepliesResult.count ?? 0,
      botStatus: business?.bot_active ?? false,
      whatsappStatus: qrReplyReady || metaReplyReady || qrLocalTestMode
    }
  };
}

export async function getUserBusiness() {
  const authSupabase = await createSupabaseServerClient();
  const supabase = getSupabaseAdmin();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [{ data: business, error }, { data: qrConnection }, { data: officialSettings }, engineHealth] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("whatsapp_connections").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("whatsapp_settings").select("*").eq("user_id", user.id).maybeSingle(),
      getWhatsAppEngineHealth()
    ]);

  const plan = await getPlanSummaryForBusiness({
    businessId: business?.id ?? null,
    userId: user.id
  });

  return {
    supabase,
    user,
    business,
    plan,
    workspaceId: qrConnection?.workspace_id ?? (business?.id ? getWorkspaceId(business.id) : null),
    qrConnection: qrConnection ?? null,
    officialSettings: officialSettings ?? null,
    engineHealth,
    inboundCallbackHealth: getInboundCallbackHealth(),
    businessError: error?.message ?? null
  };
}
