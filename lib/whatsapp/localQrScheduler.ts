import "server-only";

import { shouldRunBackgroundQrSync } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { syncLocalQrBusiness } from "@/lib/whatsapp/localQrSync";

const SCHEDULER_INTERVAL_MS = 120000;
const MAX_BUSINESSES_PER_TICK = 1;

declare global {
  var __chatdoraLocalQrSchedulerStarted__: boolean | undefined;
  var __chatdoraLocalQrSchedulerTimer__: ReturnType<typeof setTimeout> | undefined;
}

async function runLocalQrSchedulerTick() {
  if (!shouldRunBackgroundQrSync()) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: connections, error } = await supabase
    .from("whatsapp_connections")
    .select("business_id, engine_status")
    .eq("mode", "qr_login")
    .eq("status", "connected")
    .eq("is_active", true)
    .order("updated_at", { ascending: true })
    .limit(MAX_BUSINESSES_PER_TICK);

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

  if (!shouldRunBackgroundQrSync()) {
    return;
  }

  globalThis.__chatdoraLocalQrSchedulerStarted__ = true;

  const scheduleNextTick = () => {
    globalThis.__chatdoraLocalQrSchedulerTimer__ = setTimeout(async () => {
      try {
        await runLocalQrSchedulerTick();
      } finally {
        scheduleNextTick();
      }
    }, SCHEDULER_INTERVAL_MS);

    // Let the process go idle naturally when nothing else is active.
    globalThis.__chatdoraLocalQrSchedulerTimer__?.unref?.();
  };

  void runLocalQrSchedulerTick().finally(scheduleNextTick);
}
