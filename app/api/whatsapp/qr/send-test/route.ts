import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getConnectionWorkspaceId } from "@/lib/whatsapp/connections";
import { callWhatsAppEngine, getWorkspaceId } from "@/lib/whatsapp/engine";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminSupabase = getSupabaseAdmin();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, to, message } = (await request.json()) as {
      businessId?: string;
      to?: string;
      message?: string;
    };

    if (!businessId || !to || !message) {
      return NextResponse.json({ error: "Missing businessId, to, or message" }, { status: 400 });
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

    const { data: connection } = await adminSupabase
      .from("whatsapp_connections")
      .select("business_id, workspace_id")
      .eq("business_id", businessId)
      .maybeSingle();
    const workspaceId = getConnectionWorkspaceId(connection) ?? getWorkspaceId(businessId);
    const response = await callWhatsAppEngine(`/sessions/${workspaceId}/send`, {
      method: "POST",
      body: JSON.stringify({ phone: to, reply: message })
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send test message" }, { status: 500 });
  }
}
