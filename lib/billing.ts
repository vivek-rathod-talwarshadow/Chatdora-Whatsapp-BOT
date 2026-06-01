import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FREE_MONTHLY_MESSAGE_LIMIT, FREE_PLAN_NAME, PLUS_PLAN_NAME, PLUS_PLAN_PRICE_INR, type ChatDoraPlanName } from "@/lib/plans";
export type LockedFeature = "faqs" | "leads" | "contacts" | "messages";

let inboundReceiptTableSupportPromise: Promise<boolean> | null = null;

export type PlanSummary = {
  planName: ChatDoraPlanName;
  status: string;
  amountInr: number;
  isPlus: boolean;
  monthlyMessageLimit: number | null;
  monthlyMessageCount: number;
  monthlyMessagesRemaining: number | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  business_id: string;
  plan_name: string;
  status: string;
  amount_inr: number;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
};

function getCurrentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

function normalizePlanName(planName: string | null | undefined): ChatDoraPlanName {
  return typeof planName === "string" && planName.trim().toLowerCase() === "plus" ? PLUS_PLAN_NAME : FREE_PLAN_NAME;
}

function buildPlanSummary(subscription: SubscriptionRow | null, monthlyMessageCount: number): PlanSummary {
  const planName = normalizePlanName(subscription?.plan_name);
  const monthlyMessageLimit = planName === PLUS_PLAN_NAME ? null : FREE_MONTHLY_MESSAGE_LIMIT;

  return {
    planName,
    status: subscription?.status ?? "active",
    amountInr: planName === PLUS_PLAN_NAME ? PLUS_PLAN_PRICE_INR : 0,
    isPlus: planName === PLUS_PLAN_NAME,
    monthlyMessageLimit,
    monthlyMessageCount,
    monthlyMessagesRemaining:
      monthlyMessageLimit === null ? null : Math.max(monthlyMessageLimit - monthlyMessageCount, 0)
  };
}

async function getLatestSubscriptionForBusiness(businessId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data ?? null) as SubscriptionRow | null;
}

async function createFreeSubscription(params: { businessId: string; userId: string }) {
  const supabase = getSupabaseAdmin();
  const payload = {
    user_id: params.userId,
    business_id: params.businessId,
    plan_name: FREE_PLAN_NAME,
    status: "active",
    amount_inr: 0,
    renewal_date: null
  };

  const { data, error } = await supabase.from("subscriptions").insert(payload).select("*").single();
  if (error) {
    throw new Error(error.message);
  }

  return data as SubscriptionRow;
}

async function getCurrentMonthReceiptCount(businessId: string) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("inbound_message_receipts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", getCurrentMonthStartIso());

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getCurrentMonthMessageCount(businessId: string) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", getCurrentMonthStartIso());

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function hasInboundReceiptTable() {
  if (!inboundReceiptTableSupportPromise) {
    inboundReceiptTableSupportPromise = (async () => {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("inbound_message_receipts")
        .select("id", { head: true, count: "exact" })
        .limit(1);

      return error?.code !== "PGRST205";
    })();
  }

  return inboundReceiptTableSupportPromise;
}

async function getCurrentMonthlyUsageCount(businessId: string) {
  if (await hasInboundReceiptTable()) {
    return getCurrentMonthReceiptCount(businessId);
  }

  return getCurrentMonthMessageCount(businessId);
}

export async function ensureBusinessSubscription(params: { businessId: string; userId: string }) {
  const existing = await getLatestSubscriptionForBusiness(params.businessId);
  if (!existing) {
    return createFreeSubscription(params);
  }

  return existing;
}

export async function getPlanSummaryForBusiness(params: { businessId: string | null; userId: string | null }) {
  if (!params.businessId || !params.userId) {
    return buildPlanSummary(null, 0);
  }

  const subscription = await ensureBusinessSubscription({
    businessId: params.businessId,
    userId: params.userId
  });
  const monthlyMessageCount =
    normalizePlanName(subscription.plan_name) === PLUS_PLAN_NAME
      ? 0
      : await getCurrentMonthlyUsageCount(params.businessId);

  return buildPlanSummary(subscription, monthlyMessageCount);
}

export async function consumeMonthlyMessageQuota(params: { businessId: string; userId: string; includesCurrentMessage?: boolean }) {
  const subscription = await ensureBusinessSubscription(params);
  const monthlyMessageCount =
    normalizePlanName(subscription.plan_name) === PLUS_PLAN_NAME
      ? 0
      : await getCurrentMonthlyUsageCount(params.businessId);
  const summary = buildPlanSummary(subscription, monthlyMessageCount);

  if (summary.isPlus) {
    return {
      allowed: true,
      plan: summary
    };
  }

  const includesCurrentMessage = params.includesCurrentMessage ?? false;
  const limitReached = includesCurrentMessage
    ? monthlyMessageCount > FREE_MONTHLY_MESSAGE_LIMIT
    : monthlyMessageCount >= FREE_MONTHLY_MESSAGE_LIMIT;

  if (limitReached) {
    return {
      allowed: false,
      plan: summary
    };
  }

  return {
    allowed: true,
    plan: summary
  };
}

export function canAccessLockedFeature(plan: PlanSummary, feature: LockedFeature) {
  if (plan.isPlus) {
    return true;
  }

  return !["faqs", "leads", "contacts", "messages"].includes(feature);
}
