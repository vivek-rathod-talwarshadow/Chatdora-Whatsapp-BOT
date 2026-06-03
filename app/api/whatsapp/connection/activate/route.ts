import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureWhatsAppConnection, updateWhatsAppConnection } from "@/lib/whatsapp/connections";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const adminSupabase = getSupabaseAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, isActive } = (await request.json()) as { businessId?: string; isActive?: boolean };
    if (!businessId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing businessId or isActive" }, { status: 400 });
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

    const { data: existingConnection } = await adminSupabase
      .from("whatsapp_connections")
      .select("mode")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingConnection?.mode) {
      await ensureWhatsAppConnection({
        userId: user.id,
        businessId,
        mode: existingConnection.mode
      });
    }

    await Promise.all([
      adminSupabase.from("businesses").update({ bot_active: isActive }).eq("id", businessId).eq("user_id", user.id),
      updateWhatsAppConnection({
        businessId,
        isActive
      }).catch(() => undefined)
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update connection activation" }, { status: 500 });
  }
}
