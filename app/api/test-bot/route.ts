import { NextResponse } from "next/server";

import { generateBotReply } from "@/lib/bot/botEngine";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const businessId = body.businessId as string;
  const message = body.message as string;

  if (!businessId || !message) {
    return NextResponse.json({ error: "Missing businessId or message" }, { status: 400 });
  }

  const result = await generateBotReply({
    businessId,
    customerPhone: "+910000000000",
    customerName: "Test Customer",
    incomingMessage: message,
    sendReply: false,
    persistLogs: false
  });

  return NextResponse.json(result);
}
