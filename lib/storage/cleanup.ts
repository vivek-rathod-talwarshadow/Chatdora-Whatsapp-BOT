import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_MESSAGE_LOGS_PER_BUSINESS = 250;

export async function cleanupBusinessStorage({
  businessId,
  userId
}: {
  businessId: string;
  userId: string;
}) {
  const supabase = getSupabaseAdmin();

  const { count: messageCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  if ((messageCount ?? 0) > MAX_MESSAGE_LOGS_PER_BUSINESS) {
    const overflow = (messageCount ?? 0) - MAX_MESSAGE_LOGS_PER_BUSINESS;
    const { data: oldestRows } = await supabase
      .from("messages")
      .select("id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(overflow);

    if ((oldestRows ?? []).length) {
      await supabase
        .from("messages")
        .delete()
        .in(
          "id",
          oldestRows!.map((row) => row.id)
        );
    }
  }

  await supabase.from("ai_logs").delete().eq("business_id", businessId);
  await supabase.from("ai_logs").delete().is("business_id", null).eq("user_id", userId);

  const { data: leads } = await supabase
    .from("leads")
    .select("id,customer_phone,message,created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if ((leads ?? []).length > 1) {
    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const lead of leads ?? []) {
      const key = `${lead.customer_phone}::${lead.message.trim().toLowerCase()}`;
      if (seen.has(key)) {
        duplicateIds.push(lead.id);
      } else {
        seen.add(key);
      }
    }

    if (duplicateIds.length) {
      await supabase.from("leads").delete().in("id", duplicateIds);
    }
  }
}
