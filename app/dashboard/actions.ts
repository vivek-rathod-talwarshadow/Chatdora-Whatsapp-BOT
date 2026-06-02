"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnerSuperAdmin } from "@/lib/admin";
import { canAccessLockedFeature, getPlanSummaryForBusiness } from "@/lib/billing";
import { FREE_PLAN_NAME, PLUS_PLAN_NAME, PLUS_PLAN_PRICE_INR } from "@/lib/plans";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/utils";
import { ensureWhatsAppConnection, getConnectionWorkspaceId, setActiveConnectionMode, setCustomerBotPaused } from "@/lib/whatsapp/connections";
import { getWorkspaceId } from "@/lib/whatsapp/engine";

async function getCurrentUser() {
  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authSupabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { authSupabase, adminSupabase: getSupabaseAdmin(), user };
}

async function requirePlusFeature(params: {
  businessId: string;
  userId: string;
  feature: "faqs" | "leads" | "contacts" | "messages";
  redirectTo: string;
}) {
  const plan = await getPlanSummaryForBusiness({
    businessId: params.businessId,
    userId: params.userId
  });

  if (!canAccessLockedFeature(plan, params.feature)) {
    redirect(`${params.redirectTo}${params.redirectTo.includes("?") ? "&" : "?"}upgrade=1`);
  }
}

async function getOwnerSuperAdmin() {
  const context = await getCurrentUser();
  requireOwnerSuperAdmin(context.user.email);
  return context;
}

export async function signOutAction() {
  const { authSupabase } = await getCurrentUser();
  await authSupabase.auth.signOut();
  redirect("/login");
}

export async function updateAccountProfileAction(formData: FormData) {
  const { authSupabase, adminSupabase, user } = await getCurrentUser();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = normalizePhoneNumber(String(formData.get("phone") ?? "")) || null;

  const profilePayload = {
    id: user.id,
    full_name: fullName || null,
    email: email || user.email || null,
    phone
  };

  const { error: profileError } = await adminSupabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
  if (profileError) {
    redirect(`/dashboard/account?error=${encodeURIComponent(profileError.message)}`);
  }

  const currentMeta = user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
  const shouldUpdateEmail = Boolean(email) && email !== user.email;
  const { error: authError } = await authSupabase.auth.updateUser({
    ...(shouldUpdateEmail ? { email } : {}),
    data: {
      ...currentMeta,
      full_name: fullName || null
    }
  });

  if (authError) {
    redirect(`/dashboard/account?error=${encodeURIComponent(authError.message)}`);
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  redirect(`/dashboard/account?saved=1${shouldUpdateEmail ? "&emailChange=1" : ""}`);
}

export async function updateAccountPasswordAction(formData: FormData) {
  const { authSupabase } = await getCurrentUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect("/dashboard/account?error=Password%20must%20be%20at%20least%208%20characters");
  }

  if (password !== confirmPassword) {
    redirect("/dashboard/account?error=Passwords%20do%20not%20match");
  }

  const { error } = await authSupabase.auth.updateUser({ password });
  if (error) {
    redirect(`/dashboard/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/account?passwordUpdated=1");
}

export async function deleteAccountAction() {
  const { authSupabase, adminSupabase, user } = await getCurrentUser();

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(`/dashboard/account?error=${encodeURIComponent(error.message)}`);
  }

  await authSupabase.auth.signOut();
  redirect("/");
}

export async function upsertBusinessAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const businessId = String(formData.get("id") ?? "");

  const payload = {
    user_id: user.id,
    business_name: String(formData.get("business_name") ?? ""),
    category: String(formData.get("category") ?? "") || null,
    owner_name: String(formData.get("owner_name") ?? "") || null,
    phone: normalizePhoneNumber(String(formData.get("phone") ?? "")) || null,
    email: String(formData.get("email") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    opening_hours: String(formData.get("opening_hours") ?? "") || null,
    website: String(formData.get("website") ?? "") || null,
    instagram: String(formData.get("instagram") ?? "") || null,
    services: String(formData.get("services") ?? "") || null,
    short_description: String(formData.get("short_description") ?? "") || null,
    default_fallback_message: String(formData.get("default_fallback_message") ?? "") || null,
    ai_fallback_message:
      String(formData.get("ai_fallback_message") ?? "") ||
      String(formData.get("default_fallback_message") ?? "") ||
      null
  };

  if (!payload.business_name.trim()) {
    redirect("/dashboard/business?error=Business%20name%20is%20required");
  }

  if (businessId) {
    const { error } = await adminSupabase.from("businesses").update(payload).eq("id", businessId).eq("user_id", user.id);
    if (error) {
      redirect(`/dashboard/business?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { data: createdBusiness, error } = await adminSupabase.from("businesses").insert({
      ...payload,
      ai_enabled: true,
      rule_based_first: true,
      ai_temperature: 0.3,
      ai_max_tokens: 180,
      ai_timeout_seconds: 12,
      bot_active: true
    }).select("id").single();
    if (error) {
      redirect(`/dashboard/business?error=${encodeURIComponent(error.message)}`);
    }

    if (createdBusiness?.id) {
      await adminSupabase.from("subscriptions").insert({
        user_id: user.id,
        business_id: createdBusiness.id,
        plan_name: FREE_PLAN_NAME,
        status: "active",
        amount_inr: 0,
        renewal_date: null
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/business");
  redirect("/dashboard/business?saved=1");
}

export async function upsertFaqAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const businessId = String(formData.get("business_id") ?? "");
  const faqId = String(formData.get("id") ?? "");
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const payload = {
    user_id: user.id,
    business_id: businessId,
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    keywords,
    priority: Number(formData.get("priority") ?? 0),
    is_active: formData.get("is_active") === "on"
  };

  if (!businessId) {
    redirect("/dashboard/faqs?error=Business%20profile%20is%20required");
  }

  await requirePlusFeature({
    businessId,
    userId: user.id,
    feature: "faqs",
    redirectTo: "/dashboard/faqs"
  });

  if (!payload.question.trim() || !payload.answer.trim()) {
    redirect("/dashboard/faqs?error=Question%20and%20answer%20are%20required");
  }

  if (faqId) {
    const { error } = await adminSupabase.from("faqs").update(payload).eq("id", faqId).eq("user_id", user.id);
    if (error) {
      redirect(`/dashboard/faqs?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await adminSupabase.from("faqs").insert(payload);
    if (error) {
      redirect(`/dashboard/faqs?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/dashboard/faqs");
  revalidatePath("/dashboard");
  redirect("/dashboard/faqs?saved=1");
}

export async function deleteFaqAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const faqId = String(formData.get("id") ?? "");
  const { data: business } = await adminSupabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();

  if (!faqId) {
    redirect("/dashboard/faqs?error=FAQ%20id%20is%20required");
  }

  if (business?.id) {
    await requirePlusFeature({
      businessId: business.id,
      userId: user.id,
      feature: "faqs",
      redirectTo: "/dashboard/faqs"
    });
  }

  const { error } = await adminSupabase.from("faqs").delete().eq("id", faqId).eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/faqs?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/faqs");
  revalidatePath("/dashboard");
  redirect("/dashboard/faqs?deleted=1");
}

export async function upsertWhatsAppSettingsAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const businessId = String(formData.get("business_id") ?? "");
  const settingsId = String(formData.get("id") ?? "");
  const isConnected = formData.get("is_connected") === "on";

  const existing = settingsId
    ? await adminSupabase.from("whatsapp_settings").select("*").eq("id", settingsId).eq("user_id", user.id).maybeSingle()
    : { data: null };

  const payload = {
    user_id: user.id,
    business_id: businessId,
    phone_number_id: String(formData.get("phone_number_id") ?? ""),
    access_token: String(formData.get("access_token") ?? "") || existing.data?.access_token,
    verify_token: String(formData.get("verify_token") ?? "") || existing.data?.verify_token,
    app_secret: String(formData.get("app_secret") ?? "") || existing.data?.app_secret || null,
    is_connected: isConnected
  };

  if (settingsId) {
    await adminSupabase.from("whatsapp_settings").update(payload).eq("id", settingsId).eq("user_id", user.id);
  } else {
    await adminSupabase.from("whatsapp_settings").insert(payload);
  }

  await ensureWhatsAppConnection({
    userId: user.id,
    businessId,
    mode: "meta_api"
  });

  const { data: connection } = await adminSupabase
    .from("whatsapp_connections")
    .select("business_id, workspace_id")
    .eq("business_id", businessId)
    .maybeSingle();

  await adminSupabase
    .from("whatsapp_connections")
    .update({
      workspace_id: getConnectionWorkspaceId(connection) ?? getWorkspaceId(businessId),
      mode: "meta_api",
      status: isConnected ? "connected" : "not_connected",
      is_active: isConnected,
      last_error: null
    })
    .eq("business_id", businessId)
    .eq("mode", "meta_api");

  if (isConnected) {
    await setActiveConnectionMode({
      businessId,
      userId: user.id,
      mode: "meta_api"
    });
  }

  revalidatePath("/dashboard/whatsapp");
  revalidatePath("/dashboard/admin/whatsapp");
  revalidatePath("/dashboard");
}

export async function updateAISettingsAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const businessId = String(formData.get("business_id") ?? "");

  await adminSupabase
    .from("businesses")
    .update({
      ai_enabled: formData.get("ai_enabled") === "on",
      rule_based_first: formData.get("rule_based_first") === "on",
      ai_temperature: Number(formData.get("ai_temperature") ?? 0.3),
      ai_max_tokens: Number(formData.get("ai_max_tokens") ?? 180),
      ai_timeout_seconds: Number(formData.get("ai_timeout_seconds") ?? 12),
      ai_fallback_message: String(formData.get("ai_fallback_message") ?? "") || null,
      bot_active: formData.get("bot_active") === "on"
    })
    .eq("id", businessId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/ai");
  revalidatePath("/dashboard");
}

export async function updateLeadStatusAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const leadId = String(formData.get("id") ?? "");
  const { data: business } = await adminSupabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();

  if (business?.id) {
    await requirePlusFeature({
      businessId: business.id,
      userId: user.id,
      feature: "leads",
      redirectTo: "/dashboard/leads"
    });
  }

  await adminSupabase
    .from("leads")
    .update({
      status: String(formData.get("status") ?? "new"),
      notes: String(formData.get("notes") ?? "") || null
    })
    .eq("id", leadId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function setBusinessBotActiveAction(formData: FormData) {
  const { adminSupabase, user } = await getCurrentUser();
  const businessId = String(formData.get("business_id") ?? "");
  const botActive = formData.get("bot_active") === "on";

  const { error } = await adminSupabase
    .from("businesses")
    .update({
      bot_active: botActive
    })
    .eq("id", businessId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/whatsapp?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/whatsapp");
  redirect("/dashboard/whatsapp?saved=1");
}

export async function toggleCustomerBotPauseAction(formData: FormData) {
  const { user } = await getCurrentUser();
  const businessId = String(formData.get("business_id") ?? "");
  const customerPhone = String(formData.get("customer_phone") ?? "");
  const shouldPause = formData.get("should_pause") === "true";

  if (!businessId || !customerPhone) {
    redirect("/dashboard/contacts?error=Missing%20contact%20details");
  }

  await requirePlusFeature({
    businessId,
    userId: user.id,
    feature: "contacts",
    redirectTo: "/dashboard/contacts"
  });

  await setCustomerBotPaused({
    businessId,
    customerPhone,
    isPaused: shouldPause
  });

  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  redirect(
    `/dashboard/contacts?saved=1&state=${shouldPause ? "paused" : "resumed"}&phone=${encodeURIComponent(customerPhone)}`
  );
}

export async function updateSubscriptionPlanAsSuperAdminAction(formData: FormData) {
  const { adminSupabase } = await getOwnerSuperAdmin();
  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const planName = String(formData.get("plan_name") ?? FREE_PLAN_NAME);
  const status = String(formData.get("status") ?? "active");

  if (!subscriptionId) {
    redirect("/dashboard/super-admin?error=Missing%20subscription");
  }

  const normalizedPlanName = planName === PLUS_PLAN_NAME ? PLUS_PLAN_NAME : FREE_PLAN_NAME;
  const amountInr = normalizedPlanName === PLUS_PLAN_NAME ? PLUS_PLAN_PRICE_INR : 0;

  const { error } = await adminSupabase
    .from("subscriptions")
    .update({
      plan_name: normalizedPlanName,
      status,
      amount_inr: amountInr
    })
    .eq("id", subscriptionId);

  if (error) {
    redirect(`/dashboard/super-admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/super-admin");
  redirect("/dashboard/super-admin?saved=1");
}

export async function deleteUserAsSuperAdminAction(formData: FormData) {
  const { adminSupabase } = await getOwnerSuperAdmin();
  const userId = String(formData.get("user_id") ?? "");

  if (!userId) {
    redirect("/dashboard/super-admin?error=Missing%20user");
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(userId);
  if (error) {
    redirect(`/dashboard/super-admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/super-admin");
  redirect("/dashboard/super-admin?saved=1");
}
