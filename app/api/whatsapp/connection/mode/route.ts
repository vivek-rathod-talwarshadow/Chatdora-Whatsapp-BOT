import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { WhatsAppConnectionMode } from "@/lib/types";
import { ensureWhatsAppConnection, setActiveConnectionMode } from "@/lib/whatsapp/connections";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const adminSupabase = getSupabaseAdmin();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, mode } = (await request.json()) as { businessId?: string; mode?: WhatsAppConnectionMode };
    if (!businessId || (mode !== "qr_login" && mode !== "meta_api")) {
      return NextResponse.json({ error: "Missing businessId or invalid mode" }, { status: 400 });
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

    await ensureWhatsAppConnection({ userId: user.id, businessId, mode });
    await setActiveConnectionMode({ businessId, userId: user.id, mode });

    return NextResponse.json({ ok: true, mode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to switch connection mode" }, { status: 500 });
  }
}
