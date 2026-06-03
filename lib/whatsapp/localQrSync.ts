import "server-only";

import { consumeMonthlyMessageQuota } from "@/lib/billing";
import { generateBotReply } from "@/lib/bot/botEngine";
import {
  getInboundCallbackHealth,
  getQrSyncMaxConversationsPerRun,
  getQrSyncMaxMessagesPerConversation,
  getQrSyncMaxRepliesPerRun,
  getQrSyncMemoryCeilingMb,
  isBackgroundQrSyncEnabled
} from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getConnectionWorkspaceId } from "@/lib/whatsapp/connections";
import { callWhatsAppEngine, getEngineConversations, getWorkspaceId, type EngineConversation, type EngineConversationMessage } from "@/lib/whatsapp/engine";
import { buildInboundMessageReceiptKey, claimInboundMessageReceipt } from "@/lib/whatsapp/inboundReceipts";

const STALE_SYNC_THRESHOLD_MS = 2 * 60 * 1000;
const MAX_COLLAPSED_MESSAGES = 5;
const BYTES_PER_MB = 1024 * 1024;
const activeBusinessSyncs = new Set<string>();

function getEngineStatusRecord(engineStatus: unknown) {
  if (engineStatus && typeof engineStatus === "object" && !Array.isArray(engineStatus)) {
    return engineStatus as Record<string, unknown>;
  }

  return null;
}

function mergeEngineStatus(existingStatus: unknown, nextStatus: Record<string, unknown>) {
  const current = getEngineStatusRecord(existingStatus);

  if (!current) {
    return nextStatus;
  }

  return {
    ...current,
    ...nextStatus
  };
}

function normalizeProcessedMessageIds(engineStatus: unknown) {
  const statusRecord = getEngineStatusRecord(engineStatus);

  if (statusRecord && Array.isArray(statusRecord.processed_message_ids)) {
    return (statusRecord.processed_message_ids as unknown[])
      .filter((value): value is string => typeof value === "string");
  }

  return [] as string[];
}

function getLocalSyncInitializedAt(engineStatus: unknown) {
  const statusRecord = getEngineStatusRecord(engineStatus);
  return statusRecord && typeof statusRecord.local_sync_initialized_at === "string"
    ? statusRecord.local_sync_initialized_at
    : null;
}

function getLastLocalSyncAt(engineStatus: unknown) {
  const statusRecord = getEngineStatusRecord(engineStatus);
  return statusRecord && typeof statusRecord.last_local_sync_at === "string"
    ? statusRecord.last_local_sync_at
    : null;
}

function getMessageExternalId(message: EngineConversationMessage) {
  return message.external_message_id || message.id || null;
}

function getMessageContent(message: EngineConversationMessage) {
  return typeof message.content === "string" ? message.content.trim() : "";
}

function getMessageTimestampMs(message: EngineConversationMessage) {
  const value = new Date(message.timestamp ?? 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function getConversationPhone(conversation: EngineConversation) {
  return typeof conversation.phone === "string" ? conversation.phone.trim() : "";
}

function getConversationRecipient(conversation: EngineConversation) {
  if (typeof conversation.chat_id === "string" && conversation.chat_id.trim()) {
    return conversation.chat_id.trim();
  }

  if (typeof conversation.id === "string" && conversation.id.trim()) {
    return conversation.id.trim();
  }

  return getConversationPhone(conversation);
}

function getEngineSendPayload(replyRecipient: string, customerPhone: string, reply: string) {
  if (replyRecipient.includes("@")) {
    return {
      chatId: replyRecipient,
      reply
    };
  }

  return {
    phone: customerPhone,
    reply
  };
}

function toIsoNow() {
  return new Date().toISOString();
}

function shouldCollapseMessages(params: {
  lastLocalSyncAt: string | null;
  queuedCount: number;
}) {
  if (params.queuedCount > 1) {
    return true;
  }

  if (!params.lastLocalSyncAt) {
    return false;
  }

  const lastSyncMs = new Date(params.lastLocalSyncAt).getTime();
  if (!Number.isFinite(lastSyncMs) || lastSyncMs <= 0) {
    return false;
  }

  return Date.now() - lastSyncMs >= STALE_SYNC_THRESHOLD_MS;
}

function buildCollapsedIncomingMessage(messages: EngineConversationMessage[]) {
  return messages
    .slice(-MAX_COLLAPSED_MESSAGES)
    .map((message) => getMessageContent(message))
    .filter(Boolean)
    .join("\n");
}

function getProcessMemoryUsageMb() {
  const usage = process.memoryUsage();

  return {
    rssMb: Math.round(usage.rss / BYTES_PER_MB),
    heapUsedMb: Math.round(usage.heapUsed / BYTES_PER_MB)
  };
}

function isMemoryPressureHigh() {
  const { rssMb } = getProcessMemoryUsageMb();
  return rssMb >= getQrSyncMemoryCeilingMb();
}

function getMostRecentMessages(messages: EngineConversationMessage[]) {
  const maxMessages = getQrSyncMaxMessagesPerConversation();

  if (messages.length <= maxMessages) {
    return messages;
  }

  return messages.slice(-maxMessages);
}

export async function syncLocalQrBusiness(params: { businessId: string; userId?: string | null }) {
  const adminSupabase = getSupabaseAdmin();
  const { businessId, userId } = params;

  if (activeBusinessSyncs.has(businessId)) {
    return {
      ok: true,
      processed: 0,
      reason: "A local QR sync is already running for this business."
    };
  }

  activeBusinessSyncs.add(businessId);

  try {
    const inboundCallbackHealth = getInboundCallbackHealth();
    if (inboundCallbackHealth.isPublic && !isBackgroundQrSyncEnabled()) {
      return {
        ok: true,
        processed: 0,
        reason: "Public callback is available, sync polling not required."
      };
    }

    let businessQuery = adminSupabase
      .from("businesses")
      .select("id,user_id,bot_active")
      .eq("id", businessId);

    let connectionQuery = adminSupabase
      .from("whatsapp_connections")
      .select("*")
      .eq("business_id", businessId);

    if (userId) {
      businessQuery = businessQuery.eq("user_id", userId);
      connectionQuery = connectionQuery.eq("user_id", userId);
    }

    const [{ data: business }, { data: connection }] = await Promise.all([
      businessQuery.maybeSingle(),
      connectionQuery.maybeSingle()
    ]);

    if (!business) {
      return { error: "Business not found", status: 404 };
    }

    if (!connection || connection.mode !== "qr_login" || connection.status !== "connected" || !connection.is_active) {
      return {
        ok: true,
        processed: 0,
        reason: "QR connection is not active."
      };
    }

    if (!business.bot_active) {
      return {
        ok: true,
        processed: 0,
        reason: "Bot is disabled."
      };
    }

    if (isMemoryPressureHigh()) {
      const memory = getProcessMemoryUsageMb();

      return {
        ok: true,
        processed: 0,
        reason: `QR sync skipped to protect memory (${memory.rssMb}MB RSS).`
      };
    }

    const workspaceId = getConnectionWorkspaceId(connection) ?? getWorkspaceId(businessId);
    const conversations = await (async () => {
      const engineData = await callWhatsAppEngine<Record<string, unknown>>(`/sessions/${workspaceId}/conversations`);
      return getEngineConversations(engineData).slice(-getQrSyncMaxConversationsPerRun());
    })();
    const processedIds = new Set(normalizeProcessedMessageIds(connection.engine_status));
    const newlyProcessedIds: string[] = [];
    const engineStatusRecord = getEngineStatusRecord(connection.engine_status);
    const localSyncInitializedAt = getLocalSyncInitializedAt(connection.engine_status);
    const syncCompletedAt = toIsoNow();
    const lastLocalSyncAt = getLastLocalSyncAt(connection.engine_status);
    let processedCount = 0;
    let lastProcessingError: string | null = null;
    const maxRepliesPerRun = getQrSyncMaxRepliesPerRun();

    if (!localSyncInitializedAt) {
      for (const conversation of conversations) {
        if (!Array.isArray(conversation.messages)) {
          continue;
        }

        for (const message of getMostRecentMessages(conversation.messages)) {
          if (message.direction !== "incoming") {
            continue;
          }

          const externalId = getMessageExternalId(message);
          if (externalId) {
            processedIds.add(externalId);
          }
        }
      }

      const nextEngineStatus = {
        ...(engineStatusRecord ?? {}),
        processed_message_ids: Array.from(processedIds).slice(-250),
        local_sync_initialized_at: syncCompletedAt,
        last_local_sync_at: syncCompletedAt
      };

      const { data: latestConnection } = await adminSupabase
        .from("whatsapp_connections")
        .select("engine_status")
        .eq("id", connection.id)
        .maybeSingle();

      await adminSupabase
        .from("whatsapp_connections")
        .update({ engine_status: mergeEngineStatus(latestConnection?.engine_status, nextEngineStatus) })
        .eq("id", connection.id);

      return {
        ok: true,
        processed: 0,
        reason: "Local QR sync initialized. Existing backlog marked as seen."
      };
    }

    for (const conversation of conversations) {
      if (processedCount >= maxRepliesPerRun) {
        lastProcessingError = lastProcessingError ?? "QR sync reply cap reached for this run.";
        break;
      }

      if (isMemoryPressureHigh()) {
        const memory = getProcessMemoryUsageMb();
        lastProcessingError = `QR sync paused to protect memory (${memory.rssMb}MB RSS).`;
        break;
      }

      const customerPhone = getConversationPhone(conversation);
      const replyRecipient = getConversationRecipient(conversation);
      if (!customerPhone || !replyRecipient || !Array.isArray(conversation.messages)) {
        continue;
      }

      const incomingMessages = getMostRecentMessages(conversation.messages)
        .filter((message) => message.direction === "incoming")
        .sort((a, b) => getMessageTimestampMs(a) - getMessageTimestampMs(b));

      const initializedAtMs = localSyncInitializedAt ? new Date(localSyncInitializedAt).getTime() : 0;
      const pendingMessages = incomingMessages.filter((message) => {
        const externalId = getMessageExternalId(message);
        const content = getMessageContent(message);
        const messageTimestampMs = getMessageTimestampMs(message);

        if (!externalId || !content || processedIds.has(externalId)) {
          return false;
        }

        if (initializedAtMs > 0 && messageTimestampMs > 0 && messageTimestampMs <= initializedAtMs) {
          processedIds.add(externalId);
          newlyProcessedIds.push(externalId);
          return false;
        }

        return true;
      });

      if (!pendingMessages.length) {
        continue;
      }

      const collapseMessages = shouldCollapseMessages({
        lastLocalSyncAt,
        queuedCount: pendingMessages.length
      });

      const messagesToProcess = collapseMessages ? [pendingMessages[pendingMessages.length - 1]] : pendingMessages;
      const incomingMessageText = collapseMessages
        ? buildCollapsedIncomingMessage(pendingMessages)
        : null;

      for (const message of messagesToProcess) {
        if (processedCount >= maxRepliesPerRun) {
          lastProcessingError = lastProcessingError ?? "QR sync reply cap reached for this run.";
          break;
        }

        if (isMemoryPressureHigh()) {
          const memory = getProcessMemoryUsageMb();
          lastProcessingError = `QR sync paused to protect memory (${memory.rssMb}MB RSS).`;
          break;
        }

        const externalId = getMessageExternalId(message);
        const content = collapseMessages ? incomingMessageText : getMessageContent(message);

        if (!externalId || !content) {
          continue;
        }

        try {
          const receiptKey = buildInboundMessageReceiptKey({
            scopeId: workspaceId,
            customerPhone,
            incomingMessage: content,
            explicitMessageId: externalId,
            timestamp: message.timestamp
          });
          const receiptClaim = await claimInboundMessageReceipt({
            businessId,
            receiptKey
          });

          if (!receiptClaim.claimed) {
            continue;
          }

          const quota = await consumeMonthlyMessageQuota({
            businessId,
            userId: business.user_id,
            includesCurrentMessage: receiptClaim.countedAtReceipt
          });

          if (!quota.allowed) {
            continue;
          }

          const result = await generateBotReply({
            businessId,
            customerPhone,
            customerName: typeof conversation.name === "string" ? conversation.name : null,
            incomingMessage: content,
            sendReply: false,
            persistLogs: true,
            connectionMode: "qr_login"
          });

          if (result.shouldSendReply && result.finalReply.trim()) {
            await callWhatsAppEngine(`/sessions/${workspaceId}/send`, {
              method: "POST",
              body: JSON.stringify(getEngineSendPayload(replyRecipient, customerPhone, result.finalReply))
            });
          }

          processedCount += 1;
        } catch (error) {
          lastProcessingError = error instanceof Error ? error.message : "Unable to process one incoming message";
        }
      }

      for (const message of pendingMessages) {
        const externalId = getMessageExternalId(message);
        if (externalId) {
          processedIds.add(externalId);
          newlyProcessedIds.push(externalId);
        }
      }
    }

    if (newlyProcessedIds.length > 0 || lastProcessingError || lastLocalSyncAt !== syncCompletedAt) {
      const nextProcessedIds = Array.from(processedIds).slice(-250);
      const nextEngineStatus = {
        ...(engineStatusRecord ?? {}),
        processed_message_ids: nextProcessedIds,
        local_sync_initialized_at: localSyncInitializedAt,
        last_local_sync_at: syncCompletedAt
      };

      const { data: latestConnection } = await adminSupabase
        .from("whatsapp_connections")
        .select("engine_status")
        .eq("id", connection.id)
        .maybeSingle();

      await adminSupabase
        .from("whatsapp_connections")
        .update({
          engine_status: mergeEngineStatus(latestConnection?.engine_status, nextEngineStatus),
          last_error: lastProcessingError
        })
        .eq("id", connection.id);
    }

    return {
      ok: true,
      processed: processedCount,
      lastError: lastProcessingError
    };
  } finally {
    activeBusinessSyncs.delete(businessId);
  }
}
