import "server-only";

import { getInboundCallbackHealth } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { syncLocalQrBusiness } from "@/lib/whatsapp/localQrSync";

const SCHEDULER_INTERVAL_MS = 15000;

declare global {
  var __chatdoraLocalQrSchedulerStarted__: boolean | undefined;
}

async function runLocalQrSchedulerTick() {
  const inboundCallbackHealth = getInboundCallbackHealth();
  if (inboundCallbackHealth.isPublic) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: connections, error } = await supabase
    .from("whatsapp_connections")
    .select("business_id")
    .eq("mode", "qr_login")
    .eq("status", "connected")
    .eq("is_active", true);

  if (error || !connections?.length) {
    return;
  }

  for (const connection of connections) {
    if (!connection.business_id) {
      continue;
    }

    try {
      await syncLocalQrBusiness({ businessId: connection.business_id });
    } catch {
      // Keep the scheduler alive even if one business fails.
    }
  }
}

export function startLocalQrScheduler() {
  if (globalThis.__chatdoraLocalQrSchedulerStarted__) {
    return;
  }

  globalThis.__chatdoraLocalQrSchedulerStarted__ = true;

  void runLocalQrSchedulerTick();
  setInterval(() => {
    void runLocalQrSchedulerTick();
  }, SCHEDULER_INTERVAL_MS);
}
