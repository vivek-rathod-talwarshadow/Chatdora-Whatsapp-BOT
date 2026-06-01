import type { AIMessage } from "@/lib/types";

const SAFE_FALLBACK =
  "Thanks for your message. Our team will reply shortly. Please share your name and requirement.";

const CANDIDATES = [
  ["openrouter", "x-ai/grok-beta", "https://openrouter.ai/api/v1", "OPROUTER_API_KEY"],
  ["openrouter", "openai/gpt-4o-mini", "https://openrouter.ai/api/v1", "OPROUTER_API_KEY"],
  ["groq", "llama-3.3-70b-versatile", "https://api.groq.com/openai/v1", "GROQ_API_KEY"],
  ["groq", "llama-3.1-8b-instant", "https://api.groq.com/openai/v1", "GROQ_API_KEY"],
  ["huggingface", "microsoft/Phi-3-mini-4k-instruct", "https://api-inference.huggingface.co/v1", "HUGGINGFACE_TOKEN"]
] as const;

const CHATDORA_BUILDER_CANDIDATES = [
  ["openrouter", "anthropic/claude-3.7-sonnet", "https://openrouter.ai/api/v1", "CHATDORA_OPENROUTER_API_KEY"],
  ["openrouter", "anthropic/claude-3.5-sonnet", "https://openrouter.ai/api/v1", "CHATDORA_OPENROUTER_API_KEY"],
  ["openrouter", "openai/gpt-4o", "https://openrouter.ai/api/v1", "CHATDORA_OPENROUTER_API_KEY"],
  ["openrouter", "x-ai/grok-beta", "https://openrouter.ai/api/v1", "CHATDORA_OPENROUTER_API_KEY"],
  ["openrouter", "openai/gpt-4o-mini", "https://openrouter.ai/api/v1", "CHATDORA_OPENROUTER_API_KEY"],
  ["groq", "llama-3.3-70b-versatile", "https://api.groq.com/openai/v1", "CHATDORA_GROQ_API_KEY"]
] as const;

interface FallbackOptions {
  businessId?: string | null;
  userId?: string | null;
  temperature?: number;
  maxTokens?: number;
  timeoutSeconds?: number;
  fallbackMessage?: string | null;
}

async function logAIResult(_: {
  userId?: string | null;
  businessId?: string | null;
  provider: string;
  model: string;
  status: string;
  error?: string | null;
  latencyMs?: number | null;
}) {
  return;
}

export function sanitizeAIReply(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s+/g, " ")
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

export function validateAIReply(text: string) {
  const reply = sanitizeAIReply(text);
  if (!reply || reply.length < 3) return false;
  if (reply.length > 600) return false;
  if (/as an ai|chatgpt|i cannot browse/i.test(reply)) return false;
  return true;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
    })
  ]);
}

export async function callOpenAICompatibleModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIMessage[],
  options?: Pick<FallbackOptions, "temperature" | "maxTokens">
) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 180
    })
  });

  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Empty response");
  }

  return content;
}

export async function callHuggingFaceModel(model: string, apiKey: string, messages: AIMessage[]) {
  const response = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 180
    })
  });

  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? data?.generated_text;

  if (typeof content !== "string") {
    throw new Error("Empty response");
  }

  return content;
}

async function callWithCandidates(
  candidates: readonly (readonly [string, string, string, string])[],
  messages: AIMessage[],
  options?: FallbackOptions
) {
  for (const [provider, model, baseUrl, apiKeyName] of candidates) {
    const apiKey = process.env[apiKeyName];

    if (!apiKey) {
      await logAIResult({
        userId: options?.userId,
        businessId: options?.businessId,
        provider,
        model,
        status: "skipped",
        error: `Missing env: ${apiKeyName}`
      });
      continue;
    }

    const startedAt = Date.now();

    try {
      const rawReply =
        provider === "huggingface"
          ? await withTimeout(callHuggingFaceModel(model, apiKey, messages), (options?.timeoutSeconds ?? 12) * 1000)
          : await withTimeout(
              callOpenAICompatibleModel(baseUrl, apiKey, model, messages, options),
              (options?.timeoutSeconds ?? 12) * 1000
            );
      const reply = sanitizeAIReply(rawReply);

      if (!validateAIReply(reply)) {
        throw new Error("Invalid AI output");
      }

      await logAIResult({
        userId: options?.userId,
        businessId: options?.businessId,
        provider,
        model,
        status: "success",
        latencyMs: Date.now() - startedAt
      });

      return {
        reply,
        model,
        provider
      };
    } catch (error) {
      await logAIResult({
        userId: options?.userId,
        businessId: options?.businessId,
        provider,
        model,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startedAt
      });
    }
  }

  return {
    reply: options?.fallbackMessage?.trim() || SAFE_FALLBACK,
    model: null,
    provider: null
  };
}

export async function callAIWithFallback(messages: AIMessage[], options?: FallbackOptions) {
  return callWithCandidates(CANDIDATES, messages, options);
}

export async function callBuilderAIWithFallback(messages: AIMessage[], options?: FallbackOptions) {
  return callWithCandidates(CHATDORA_BUILDER_CANDIDATES, messages, options);
}
