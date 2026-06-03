import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getCurrentUser();
  const supabase = getSupabaseAdmin();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.phone_number_id || !settings?.access_token) {
    return NextResponse.json({ error: "Please save WhatsApp settings first" }, { status: 400 });
  }

  const apiVersion = process.env.META_GRAPH_API_VERSION || "v19.0";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${settings.phone_number_id}`, {
    headers: {
      Authorization: `Bearer ${settings.access_token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || "Meta API rejected the token" }, { status: 400 });
  }

  return NextResponse.json({
    connected: true,
    phoneNumberId: settings.phone_number_id,
    displayPhoneNumber: data.display_phone_number ?? null
  });
}
