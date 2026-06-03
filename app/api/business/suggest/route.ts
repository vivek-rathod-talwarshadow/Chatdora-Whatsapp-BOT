import { NextResponse } from "next/server";

import { callBuilderAIWithFallback } from "@/lib/ai/modelRouter";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { AIMessage } from "@/lib/types";

function extractJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function buildFallbackSuggestion(input: {
  businessName: string;
  category: string;
  services: string;
  openingHours: string;
}) {
  const businessLabel = input.businessName || "your business";
  const category = input.category || "local business";
  const servicesLine = input.services?.trim()
    ? input.services
    : `Consultation, ${category} support, WhatsApp support, and customer assistance`;
  const hoursLine = input.openingHours?.trim() ? ` Open hours: ${input.openingHours}.` : "";

  return {
    category: input.category || "Local business",
    services: servicesLine,
    short_description: `${businessLabel} is a ${category.toLowerCase()} focused on responsive customer service, clear communication, and helping customers get fast answers on WhatsApp.${hoursLine}`.trim(),
    default_fallback_message: `Hello, welcome to ${businessLabel}. Please share your name and requirement, and our team will reply shortly.`,
    ai_fallback_message: `Welcome to ${businessLabel}. Please share your name and what you need help with, and our team will reply shortly.`
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = {
    businessName: String(body?.businessName ?? "").trim(),
    category: String(body?.category ?? "").trim(),
    services: String(body?.services ?? "").trim(),
    openingHours: String(body?.openingHours ?? "").trim(),
    website: String(body?.website ?? "").trim(),
    instagram: String(body?.instagram ?? "").trim()
  };

  if (!input.businessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const fallback = buildFallbackSuggestion(input);

  const messages: AIMessage[] = [
    {
      role: "system",
      content:
        "You generate concise business profile copy for a SaaS dashboard. Return strict JSON only with keys: category, services, short_description, default_fallback_message, ai_fallback_message. Keep tone professional, short, and WhatsApp-friendly. Do not add markdown."
    },
    {
      role: "user",
      content: JSON.stringify({
        business_name: input.businessName,
        category: input.category,
        services: input.services,
        opening_hours: input.openingHours,
        website: input.website,
        instagram: input.instagram
      })
    }
  ];

  try {
    const result = await callBuilderAIWithFallback(messages, {
      userId: user.id,
      temperature: 0.4,
      maxTokens: 260,
      timeoutSeconds: 12,
      fallbackMessage: JSON.stringify(fallback)
    });
    const parsed = extractJsonObject(result.reply);
    const suggestion = {
      category: String(parsed?.category ?? fallback.category).trim(),
      services: String(parsed?.services ?? fallback.services).trim(),
      short_description: String(parsed?.short_description ?? fallback.short_description).trim(),
      default_fallback_message: String(parsed?.default_fallback_message ?? fallback.default_fallback_message).trim(),
      ai_fallback_message: String(parsed?.ai_fallback_message ?? fallback.ai_fallback_message).trim()
    };

    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({ suggestion: fallback });
  }
}
